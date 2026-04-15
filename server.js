import http from "node:http";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { KokoroTTS } from "kokoro-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, "public");
const dataDir = path.join(__dirname, "data");
const saveFile = path.join(dataDir, "savegame.json");
const legacySaveFile = path.join(dataDir, "savegame-v2.json");
const ttsCacheDir = path.join(dataDir, "tts-cache");

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || "127.0.0.1";
const ttsModelId = "onnx-community/Kokoro-82M-v1.0-ONNX";

let ttsPromise = null;

const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "application/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml; charset=utf-8"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".ico", "image/x-icon"]
]);

const defaultSave = {
  totalScore: 0,
  totalHits: 0,
  totalMisses: 0,
  roundsCleared: 0,
  bestStreak: 0,
  currentStreak: 0,
  updatedAt: null
};

async function ensureDataDirs() {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.mkdir(ttsCacheDir, { recursive: true });
}

async function getTts() {
  if (!ttsPromise) {
    ttsPromise = KokoroTTS.from_pretrained(ttsModelId, {
      dtype: "q8",
      device: "cpu"
    }).catch((error) => {
      ttsPromise = null;
      throw error;
    });
  }

  return ttsPromise;
}

async function readSaveFile(filePath, defaults) {
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = JSON.parse(raw);
  return { ...defaults, ...parsed };
}

async function loadSave(filePath, defaults, fallbackPaths = []) {
  await ensureDataDirs();

  try {
    return await readSaveFile(filePath, defaults);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }

  for (const fallbackPath of fallbackPaths) {
    try {
      return await readSaveFile(fallbackPath, defaults);
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error;
      }
    }
  }

  return { ...defaults };
}

async function writeSave(filePath, defaults, nextSave) {
  await ensureDataDirs();
  const payload = {
    ...defaults,
    ...nextSave,
    updatedAt: new Date().toISOString()
  };
  await fs.writeFile(filePath, JSON.stringify(payload, null, 2), "utf8");
  return payload;
}

async function readBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    request.on("data", (chunk) => {
      chunks.push(chunk);
    });

    request.on("end", () => {
      resolve(Buffer.concat(chunks).toString("utf8"));
    });

    request.on("error", reject);
  });
}

async function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(payload, null, 2));
}

function sendBuffer(response, statusCode, payload, contentType) {
  response.writeHead(statusCode, {
    "Content-Type": contentType,
    "Content-Length": payload.length,
    "Cache-Control": "public, max-age=31536000, immutable"
  });
  response.end(payload);
}

function redirect(response, location) {
  response.writeHead(302, {
    Location: location,
    "Cache-Control": "no-store"
  });
  response.end();
}

function clampSpeed(value) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return 1;
  }

  return Math.min(1.2, Math.max(0.7, parsed));
}

async function synthesizeSpeech({ text, voice, speed }) {
  await ensureDataDirs();

  const cacheKey = createHash("sha1")
    .update(JSON.stringify({ text, voice, speed }))
    .digest("hex");
  const cachePath = path.join(ttsCacheDir, `${cacheKey}.wav`);

  try {
    return await fs.readFile(cachePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }

  const tts = await getTts();
  const audio = await tts.generate(text, { voice, speed });
  const wav = Buffer.from(audio.toWav());
  await fs.writeFile(cachePath, wav);
  return wav;
}

async function serveStatic(response, requestPath) {
  let normalizedPath = requestPath;

  if (requestPath === "/") {
    normalizedPath = "/index.html";
  } else if (requestPath.endsWith("/")) {
    normalizedPath = `${requestPath}index.html`;
  } else if (!path.extname(requestPath)) {
    normalizedPath = `${requestPath}/index.html`;
  }

  const safePath = path.normalize(normalizedPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(publicDir, safePath);

  if (!filePath.startsWith(publicDir)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    const contents = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes.get(ext) || "application/octet-stream";

    response.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": "no-store"
    });
    response.end(contents);
  } catch (error) {
    if (error.code === "ENOENT") {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    response.writeHead(500);
    response.end("Internal server error");
  }
}

function normalizeLegacyPath(pathname) {
  if (pathname === "/v2") {
    return "/";
  }

  if (pathname.startsWith("/v2/")) {
    return pathname.slice(3) || "/";
  }

  return null;
}

function isSaveRoute(pathname) {
  return pathname === "/api/save" || pathname === "/api/v2/save";
}

function isSaveResetRoute(pathname) {
  return pathname === "/api/save/reset" || pathname === "/api/v2/save/reset";
}

const server = http.createServer(async (request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);
  const legacyPath = normalizeLegacyPath(requestUrl.pathname);

  if (legacyPath !== null) {
    redirect(response, `${legacyPath}${requestUrl.search}`);
    return;
  }

  if (request.method === "GET" && requestUrl.pathname === "/health") {
    await sendJson(response, 200, {
      status: "ok"
    });
    return;
  }

  if (request.method === "GET" && requestUrl.pathname === "/api/tts") {
    try {
      const text = (requestUrl.searchParams.get("text") || "").trim();
      const voice = (requestUrl.searchParams.get("voice") || "af_heart").trim();
      const speed = clampSpeed(requestUrl.searchParams.get("speed"));

      if (!text || text.length > 160) {
        await sendJson(response, 400, {
          error: "Invalid TTS text"
        });
        return;
      }

      const wav = await synthesizeSpeech({ text, voice, speed });
      sendBuffer(response, 200, wav, "audio/wav");
    } catch (error) {
      console.error("TTS generation failed", error);
      await sendJson(response, 500, {
        error: "TTS generation failed"
      });
    }
    return;
  }

  if (request.method === "GET" && isSaveRoute(requestUrl.pathname)) {
    const save = await loadSave(saveFile, defaultSave, [legacySaveFile]);
    await sendJson(response, 200, save);
    return;
  }

  if (request.method === "POST" && isSaveRoute(requestUrl.pathname)) {
    try {
      const body = await readBody(request);
      const nextSave = JSON.parse(body || "{}");
      const persisted = await writeSave(saveFile, defaultSave, nextSave);
      await sendJson(response, 200, persisted);
    } catch (error) {
      await sendJson(response, 400, {
        error: "Invalid save payload"
      });
    }
    return;
  }

  if (request.method === "POST" && isSaveResetRoute(requestUrl.pathname)) {
    const persisted = await writeSave(saveFile, defaultSave, defaultSave);
    await sendJson(response, 200, persisted);
    return;
  }

  await serveStatic(response, requestUrl.pathname);
});

server.listen(port, host, async () => {
  await ensureDataDirs();
  getTts()
    .then(() => {
      console.log("Kokoro TTS ready");
    })
    .catch((error) => {
      console.error("Kokoro TTS failed to warm", error);
    });
  console.log(`WordBlaster running at http://${host}:${port}`);
});
