import { wordBank } from "./word-bank.js";

const SAVE_URL = "/api/v2/save";
const RESET_URL = "/api/v2/save/reset";
const TTS_URL = "/api/tts";

const TILE_W = 122;
const TILE_H = 62;
const MAP_COLS = 38;
const MAP_ROWS = 28;
const TARGET_WINDOW_MS = 20000;
const PROMPT_FALLBACK_MS = 1600;
const MISS_REVEAL_MS = 2800;
const HIT_PAUSE_MS = 950;
const TARGET_REPEAT_RATE = 0.1;
const RECENT_TARGET_MAX = Math.max(180, Math.floor(wordBank.length * 0.8));
const DPR = Math.min(window.devicePixelRatio || 1, 2);

const pointsByDifficulty = {
  simple: 100,
  medium: 300,
  "mid-hard": 500,
  hard: 1000
};
const difficultyList = ["simple", "medium", "mid-hard", "hard"];
const RECENT_DIFFICULTY_MAX = 6;
const difficultyMix = {
  default: { simple: 30, medium: 28, "mid-hard": 24, hard: 18 },
  assist1: { simple: 38, medium: 30, "mid-hard": 20, hard: 12 },
  assist2: { simple: 46, medium: 31, "mid-hard": 15, hard: 8 }
};

const vehicleTypes = {
  tank: {
    id: "tank",
    name: "Tank",
    color: "#6f7f49",
    accent: "#49542d",
    highlight: "#94aa61",
    speedMin: 0.54,
    speedMax: 0.8,
    hitW: 58,
    hitH: 40
  },
  humvee: {
    id: "humvee",
    name: "Humvee",
    color: "#8f8a5c",
    accent: "#615a38",
    highlight: "#b1ab75",
    speedMin: 0.9,
    speedMax: 1.22,
    hitW: 48,
    hitH: 34
  },
  tanker: {
    id: "tanker",
    name: "Tanker",
    color: "#7e7566",
    accent: "#534c42",
    highlight: "#9b8f7c",
    speedMin: 0.68,
    speedMax: 0.92,
    hitW: 64,
    hitH: 38
  },
  artillery: {
    id: "artillery",
    name: "Artillery",
    color: "#7b6d48",
    accent: "#54472f",
    highlight: "#a48f61",
    speedMin: 0.48,
    speedMax: 0.72,
    hitW: 60,
    hitH: 36
  },
  launcher: {
    id: "launcher",
    name: "Launcher",
    color: "#556f5d",
    accent: "#35483d",
    highlight: "#73957c",
    speedMin: 0.7,
    speedMax: 0.98,
    hitW: 58,
    hitH: 36
  }
};

const patrolPresets = [
  {
    id: "wadi-crossroads",
    name: "Wadi Crossroads",
    subtitle: "Armor columns cut across a dry riverbed while support trucks climb the ridge road.",
    focus: { x: 18, y: 13 },
    zones: [
      { type: "wadi", x: 18, y: 13, rx: 13, ry: 4.7 },
      { type: "scrub", x: 8, y: 19, rx: 7, ry: 5 },
      { type: "scrub", x: 27, y: 7, rx: 6, ry: 4 },
      { type: "ridge", x: 29, y: 9, rx: 6, ry: 5 },
      { type: "pad", x: 17, y: 12.5, rx: 4.2, ry: 3.2 }
    ],
    props: [
      { type: "tent", x: 17.1, y: 11.9, scale: 1.18 },
      { type: "tent", x: 18.6, y: 13.1, scale: 1.04 },
      { type: "crate", x: 16.5, y: 13.6, scale: 1.1 },
      { type: "crate", x: 19.3, y: 12.2, scale: 0.95 },
      { type: "tower", x: 20.7, y: 11.6, scale: 1.08 },
      { type: "fuel", x: 19.8, y: 13.8, scale: 1.02 },
      { type: "rock", x: 27.9, y: 8.8, scale: 1.2 },
      { type: "rock", x: 10.8, y: 20.8, scale: 0.92 },
      { type: "berm", x: 12.4, y: 10.2, scale: 1.2 },
      { type: "berm", x: 24.9, y: 14.1, scale: 1.12 }
    ],
    lanes: [
      {
        id: "west-armor",
        role: "armor",
        direction: 1,
        speedScale: 0.9,
        roadRadius: 1,
        convoy: ["tank", "tank", "humvee", "launcher"],
        points: [
          { x: 2, y: 12 },
          { x: 8, y: 12 },
          { x: 14, y: 12 },
          { x: 20, y: 13 },
          { x: 28, y: 14 },
          { x: 34, y: 14 }
        ]
      },
      {
        id: "south-support",
        role: "support",
        direction: -1,
        speedScale: 0.95,
        roadRadius: 1,
        convoy: ["humvee", "tanker", "humvee", "artillery"],
        points: [
          { x: 8, y: 25 },
          { x: 11, y: 21 },
          { x: 15, y: 17 },
          { x: 18, y: 13 },
          { x: 23, y: 9 },
          { x: 28, y: 5 }
        ]
      },
      {
        id: "ridge-battery",
        role: "battery",
        direction: 1,
        speedScale: 0.82,
        roadRadius: 1,
        convoy: ["artillery", "launcher", "humvee"],
        points: [
          { x: 22, y: 4 },
          { x: 25, y: 7 },
          { x: 28, y: 10 },
          { x: 31, y: 13 },
          { x: 34, y: 16 }
        ]
      },
      {
        id: "wadi-flank",
        role: "flank",
        direction: -1,
        speedScale: 1.02,
        roadRadius: 1,
        convoy: ["humvee", "humvee", "tank"],
        points: [
          { x: 5, y: 7 },
          { x: 10, y: 9 },
          { x: 15, y: 11 },
          { x: 21, y: 12 },
          { x: 27, y: 12 }
        ]
      },
      {
        id: "north-bypass",
        role: "service",
        direction: 1,
        speedScale: 0.94,
        roadRadius: 1,
        convoy: [],
        points: [
          { x: 3, y: 9 },
          { x: 8, y: 8 },
          { x: 14, y: 8 },
          { x: 20, y: 9 },
          { x: 26, y: 11 },
          { x: 33, y: 12 }
        ]
      },
      {
        id: "camp-loop",
        role: "service",
        direction: -1,
        speedScale: 0.9,
        roadRadius: 1,
        convoy: ["humvee"],
        points: [
          { x: 13, y: 15 },
          { x: 15, y: 14 },
          { x: 18, y: 14 },
          { x: 21, y: 15 },
          { x: 22, y: 17 },
          { x: 20, y: 18 },
          { x: 16, y: 18 },
          { x: 13, y: 16 }
        ]
      }
    ]
  },
  {
    id: "switchback-ridge",
    name: "Switchback Ridge",
    subtitle: "Fast scout vehicles cut through switchbacks while launchers and tankers protect the rear slope.",
    focus: { x: 20, y: 12 },
    zones: [
      { type: "ridge", x: 14, y: 9, rx: 9, ry: 5.2 },
      { type: "ridge", x: 24, y: 17, rx: 8, ry: 5 },
      { type: "scrub", x: 7, y: 18, rx: 6, ry: 5 },
      { type: "scrub", x: 31, y: 8, rx: 5, ry: 4 },
      { type: "pad", x: 22.5, y: 10.5, rx: 3.2, ry: 2.6 }
    ],
    props: [
      { type: "tower", x: 22.7, y: 10.1, scale: 1.12 },
      { type: "crate", x: 23.9, y: 11.2, scale: 1.05 },
      { type: "crate", x: 21.8, y: 10.9, scale: 0.95 },
      { type: "fuel", x: 22.3, y: 12.1, scale: 0.95 },
      { type: "tent", x: 24.2, y: 10.4, scale: 0.96 },
      { type: "rock", x: 14.6, y: 7.1, scale: 1.2 },
      { type: "rock", x: 28.9, y: 17.7, scale: 1.12 },
      { type: "berm", x: 11.8, y: 15.6, scale: 1.08 },
      { type: "berm", x: 29.8, y: 11.2, scale: 1.04 }
    ],
    lanes: [
      {
        id: "north-switchback",
        role: "scout",
        direction: 1,
        speedScale: 1.08,
        roadRadius: 1,
        convoy: ["humvee", "humvee", "launcher", "tank"],
        points: [
          { x: 6, y: 4 },
          { x: 10, y: 6 },
          { x: 13, y: 8 },
          { x: 17, y: 9 },
          { x: 21, y: 11 },
          { x: 26, y: 13 },
          { x: 31, y: 15 }
        ]
      },
      {
        id: "south-ridge",
        role: "support",
        direction: -1,
        speedScale: 0.88,
        roadRadius: 1,
        convoy: ["tanker", "humvee", "artillery", "humvee"],
        points: [
          { x: 7, y: 23 },
          { x: 11, y: 20 },
          { x: 15, y: 18 },
          { x: 19, y: 16 },
          { x: 24, y: 14 },
          { x: 30, y: 12 }
        ]
      },
      {
        id: "relay-spine",
        role: "launcher",
        direction: 1,
        speedScale: 0.8,
        roadRadius: 1,
        convoy: ["launcher", "tank", "launcher"],
        points: [
          { x: 18, y: 3 },
          { x: 19, y: 7 },
          { x: 21, y: 11 },
          { x: 23, y: 15 },
          { x: 26, y: 19 },
          { x: 29, y: 23 }
        ]
      },
      {
        id: "rear-haul",
        role: "haul",
        direction: -1,
        speedScale: 0.86,
        roadRadius: 1,
        convoy: ["tanker", "tanker", "humvee"],
        points: [
          { x: 27, y: 4 },
          { x: 25, y: 7 },
          { x: 23, y: 10 },
          { x: 20, y: 14 },
          { x: 16, y: 18 },
          { x: 12, y: 22 }
        ]
      },
      {
        id: "saddle-cut",
        role: "service",
        direction: 1,
        speedScale: 0.92,
        roadRadius: 1,
        convoy: [],
        points: [
          { x: 4, y: 10 },
          { x: 8, y: 11 },
          { x: 13, y: 12 },
          { x: 18, y: 13 },
          { x: 24, y: 15 },
          { x: 30, y: 17 }
        ]
      },
      {
        id: "ridge-loop",
        role: "service",
        direction: -1,
        speedScale: 0.84,
        roadRadius: 1,
        convoy: ["humvee"],
        points: [
          { x: 22, y: 8 },
          { x: 24, y: 10 },
          { x: 26, y: 13 },
          { x: 27, y: 16 },
          { x: 25, y: 18 },
          { x: 22, y: 17 },
          { x: 20, y: 14 },
          { x: 20, y: 10 }
        ]
      }
    ]
  },
  {
    id: "depot-ring",
    name: "Depot Ring",
    subtitle: "A forward supply depot sits inside an oval patrol ring with fast flanks and heavy escorts.",
    focus: { x: 20, y: 14 },
    zones: [
      { type: "pad", x: 20, y: 14, rx: 6.4, ry: 4.8 },
      { type: "scrub", x: 7, y: 10, rx: 7, ry: 5 },
      { type: "scrub", x: 31, y: 17, rx: 6, ry: 5 },
      { type: "wadi", x: 11, y: 20, rx: 6, ry: 3.6 },
      { type: "ridge", x: 29, y: 7, rx: 5, ry: 4.2 }
    ],
    props: [
      { type: "tent", x: 18.2, y: 13.2, scale: 1.08 },
      { type: "tent", x: 20.6, y: 14.2, scale: 1.18 },
      { type: "tent", x: 22.7, y: 12.6, scale: 0.98 },
      { type: "crate", x: 17.1, y: 15.2, scale: 1.02 },
      { type: "crate", x: 19.6, y: 15.6, scale: 0.92 },
      { type: "fuel", x: 21.6, y: 15.4, scale: 1.08 },
      { type: "tower", x: 23.2, y: 13.2, scale: 1.1 },
      { type: "berm", x: 15.4, y: 11.8, scale: 1.1 },
      { type: "berm", x: 24.8, y: 16.8, scale: 1.15 },
      { type: "rock", x: 30.1, y: 8.2, scale: 1.0 }
    ],
    lanes: [
      {
        id: "outer-west",
        role: "armor",
        direction: 1,
        speedScale: 0.9,
        roadRadius: 1,
        convoy: ["tank", "humvee", "tank", "launcher"],
        points: [
          { x: 5, y: 14 },
          { x: 9, y: 12 },
          { x: 13, y: 11 },
          { x: 17, y: 10 },
          { x: 21, y: 10 },
          { x: 26, y: 11 },
          { x: 31, y: 13 }
        ]
      },
      {
        id: "outer-east",
        role: "support",
        direction: -1,
        speedScale: 0.86,
        roadRadius: 1,
        convoy: ["tanker", "humvee", "artillery", "humvee"],
        points: [
          { x: 31, y: 18 },
          { x: 27, y: 18 },
          { x: 23, y: 18 },
          { x: 19, y: 18 },
          { x: 14, y: 19 },
          { x: 9, y: 20 },
          { x: 5, y: 22 }
        ]
      },
      {
        id: "depot-diagonal",
        role: "inner",
        direction: 1,
        speedScale: 1.04,
        roadRadius: 1,
        convoy: ["humvee", "humvee", "launcher"],
        points: [
          { x: 11, y: 8 },
          { x: 14, y: 10 },
          { x: 17, y: 12 },
          { x: 20, y: 14 },
          { x: 24, y: 16 },
          { x: 28, y: 18 }
        ]
      },
      {
        id: "wadi-haul",
        role: "haul",
        direction: -1,
        speedScale: 0.82,
        roadRadius: 1,
        convoy: ["tanker", "artillery", "tank"],
        points: [
          { x: 8, y: 24 },
          { x: 11, y: 21 },
          { x: 14, y: 18 },
          { x: 17, y: 15 },
          { x: 21, y: 12 },
          { x: 25, y: 9 }
        ]
      },
      {
        id: "north-bypass",
        role: "service",
        direction: 1,
        speedScale: 0.92,
        roadRadius: 1,
        convoy: [],
        points: [
          { x: 6, y: 9 },
          { x: 11, y: 8 },
          { x: 16, y: 8 },
          { x: 22, y: 8 },
          { x: 28, y: 9 },
          { x: 33, y: 11 }
        ]
      },
      {
        id: "south-orbit",
        role: "service",
        direction: -1,
        speedScale: 0.88,
        roadRadius: 1,
        convoy: ["humvee"],
        points: [
          { x: 8, y: 23 },
          { x: 12, y: 22 },
          { x: 17, y: 21 },
          { x: 22, y: 20 },
          { x: 27, y: 20 },
          { x: 31, y: 21 }
        ]
      }
    ]
  },
  {
    id: "forked-escarpment",
    name: "Forked Escarpment",
    subtitle: "A split route climbs from a low pass to a mesa shelf, with scouts screening well ahead of the heavy column.",
    focus: { x: 18, y: 13 },
    zones: [
      { type: "ridge", x: 12, y: 8, rx: 8, ry: 4.8 },
      { type: "ridge", x: 27, y: 8, rx: 7, ry: 4.3 },
      { type: "wadi", x: 15, y: 19, rx: 9, ry: 4.4 },
      { type: "scrub", x: 30, y: 18, rx: 6, ry: 5 },
      { type: "pad", x: 19, y: 11.5, rx: 3.7, ry: 2.9 }
    ],
    props: [
      { type: "tower", x: 19.2, y: 10.8, scale: 1.08 },
      { type: "tent", x: 18.0, y: 11.8, scale: 1.02 },
      { type: "tent", x: 20.6, y: 12.1, scale: 0.94 },
      { type: "crate", x: 17.2, y: 12.9, scale: 1.0 },
      { type: "crate", x: 21.1, y: 11.5, scale: 0.9 },
      { type: "fuel", x: 20.0, y: 13.0, scale: 0.98 },
      { type: "berm", x: 14.2, y: 10.0, scale: 1.1 },
      { type: "berm", x: 24.6, y: 9.5, scale: 1.08 },
      { type: "rock", x: 9.9, y: 7.3, scale: 1.12 },
      { type: "rock", x: 29.7, y: 7.1, scale: 1.06 },
      { type: "rock", x: 27.8, y: 19.2, scale: 0.94 }
    ],
    lanes: [
      {
        id: "pass-guard",
        role: "armor",
        direction: 1,
        speedScale: 0.88,
        roadRadius: 1,
        convoy: ["tank", "tank", "humvee", "artillery"],
        points: [
          { x: 3, y: 14 },
          { x: 8, y: 13 },
          { x: 13, y: 12 },
          { x: 18, y: 12 },
          { x: 24, y: 12 },
          { x: 30, y: 11 },
          { x: 35, y: 10 }
        ]
      },
      {
        id: "mesa-screen",
        role: "scout",
        direction: -1,
        speedScale: 1.12,
        roadRadius: 1,
        convoy: ["humvee", "humvee", "launcher"],
        points: [
          { x: 31, y: 4 },
          { x: 27, y: 5 },
          { x: 22, y: 7 },
          { x: 17, y: 8 },
          { x: 12, y: 8 },
          { x: 7, y: 7 }
        ]
      },
      {
        id: "valley-haul",
        role: "haul",
        direction: -1,
        speedScale: 0.84,
        roadRadius: 1,
        convoy: ["tanker", "tanker", "humvee"],
        points: [
          { x: 29, y: 24 },
          { x: 26, y: 21 },
          { x: 22, y: 18 },
          { x: 18, y: 15 },
          { x: 14, y: 13 },
          { x: 9, y: 11 }
        ]
      },
      {
        id: "fork-link",
        role: "support",
        direction: 1,
        speedScale: 0.93,
        roadRadius: 1,
        convoy: ["humvee", "launcher", "tank"],
        points: [
          { x: 10, y: 22 },
          { x: 13, y: 18 },
          { x: 16, y: 15 },
          { x: 19, y: 12 },
          { x: 23, y: 9 },
          { x: 27, y: 6 }
        ]
      },
      {
        id: "mesa-loop",
        role: "service",
        direction: 1,
        speedScale: 0.94,
        roadRadius: 1,
        convoy: [],
        points: [
          { x: 8, y: 6 },
          { x: 12, y: 5 },
          { x: 17, y: 5 },
          { x: 22, y: 5 },
          { x: 27, y: 6 },
          { x: 31, y: 8 }
        ]
      },
      {
        id: "wadi-bypass",
        role: "service",
        direction: -1,
        speedScale: 0.86,
        roadRadius: 1,
        convoy: ["humvee"],
        points: [
          { x: 6, y: 18 },
          { x: 10, y: 17 },
          { x: 15, y: 16 },
          { x: 20, y: 16 },
          { x: 25, y: 17 },
          { x: 30, y: 19 }
        ]
      }
    ]
  }
];

const elements = {
  canvas: document.querySelector("#battlefield"),
  scoreValue: document.querySelector("#scoreValue"),
  hitsValue: document.querySelector("#hitsValue"),
  missesValue: document.querySelector("#missesValue"),
  streakValue: document.querySelector("#streakValue"),
  targetWord: document.querySelector("#targetWord"),
  targetMeta: document.querySelector("#targetMeta"),
  timerValue: document.querySelector("#timerValue"),
  timerFill: document.querySelector("#timerFill"),
  statusLine: document.querySelector("#statusLine"),
  patrolLine: document.querySelector("#patrolLine"),
  pauseButton: document.querySelector("#pauseButton"),
  repeatButton: document.querySelector("#repeatButton"),
  newPatrolButton: document.querySelector("#newPatrolButton"),
  centerButton: document.querySelector("#centerButton"),
  resetButton: document.querySelector("#resetButton"),
  toastTemplate: document.querySelector("#toastTemplate")
};

const ctx = elements.canvas.getContext("2d");
const pressedKeys = new Set();

const state = {
  save: null,
  patrolIndex: 0,
  patrol: null,
  lanes: [],
  roadTiles: new Set(),
  vehicles: [],
  particles: [],
  targetVehicleId: null,
  targetDeadline: 0,
  promptFallbackAt: 0,
  nextTargetAt: 0,
  status: "boot",
  now: performance.now(),
  lastFrame: performance.now(),
  drag: null,
  keyboardPan: { x: 0, y: 0 },
  camera: { x: 0, y: 0, targetX: null, targetY: null },
  viewport: { width: 1280, height: 720 },
  mapBounds: null,
  promptToken: 0,
  currentAudio: null,
  recentTargetWords: [],
  recentTargetDifficulties: [],
  lastTargetVehicleId: null,
  lastTargetLaneIndex: null,
  assistRounds: 0,
  lastOutcome: null,
  paused: false,
  statusText: "Drag to pan. Click a labeled vehicle to blast it."
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function chance(probability) {
  return Math.random() < probability;
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

function weightedPick(entries) {
  const filtered = entries.filter((entry) => entry.weight > 0);

  if (!filtered.length) {
    return null;
  }

  const total = filtered.reduce((sum, entry) => sum + entry.weight, 0);
  let remaining = Math.random() * total;

  for (const entry of filtered) {
    remaining -= entry.weight;
    if (remaining <= 0) {
      return entry.item;
    }
  }

  return filtered[filtered.length - 1].item;
}

function worldToScreenRaw(x, y) {
  return {
    x: (x - y) * (TILE_W / 2),
    y: (x + y) * (TILE_H / 2)
  };
}

function worldToScreen(x, y) {
  const raw = worldToScreenRaw(x, y);
  return {
    x: raw.x + state.camera.x,
    y: raw.y + state.camera.y
  };
}

function getCanvasPoint(event) {
  const rect = elements.canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
}

function noise(x, y) {
  const value = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function formatDifficulty(difficulty) {
  return difficulty.replace("-", " ");
}

function pushRecentTargetWord(word) {
  state.recentTargetWords.unshift(word);
  state.recentTargetWords = state.recentTargetWords.slice(0, RECENT_TARGET_MAX);
}

function pushRecentTargetDifficulty(difficulty) {
  state.recentTargetDifficulties.unshift(difficulty);
  state.recentTargetDifficulties = state.recentTargetDifficulties.slice(0, RECENT_DIFFICULTY_MAX);
}

function clampCamera() {
  if (!state.mapBounds) {
    return;
  }

  const marginX = 220;
  const marginY = 140;

  const minX = state.viewport.width - state.mapBounds.maxX - marginX;
  const maxX = -state.mapBounds.minX + marginX;
  const minY = state.viewport.height - state.mapBounds.maxY - marginY;
  const maxY = -state.mapBounds.minY + marginY;

  state.camera.x = clamp(state.camera.x, minX, maxX);
  state.camera.y = clamp(state.camera.y, minY, maxY);
}

function focusCameraOn(worldX, worldY) {
  const raw = worldToScreenRaw(worldX, worldY);
  state.camera.targetX = state.viewport.width * 0.56 - raw.x;
  state.camera.targetY = state.viewport.height * 0.36 - raw.y;
}

function snapCameraToTarget() {
  if (state.camera.targetX === null || state.camera.targetY === null) {
    return;
  }

  state.camera.x = state.camera.targetX;
  state.camera.y = state.camera.targetY;
  clampCamera();
}

function centerCamera() {
  if (!state.patrol) {
    return;
  }

  focusCameraOn(state.patrol.focus.x, state.patrol.focus.y);
}

function createLane(config) {
  const segments = [];
  let length = 0;

  for (let index = 0; index < config.points.length - 1; index += 1) {
    const from = config.points[index];
    const to = config.points[index + 1];
    const segmentLength = Math.hypot(to.x - from.x, to.y - from.y);
    segments.push({
      from,
      to,
      start: length,
      length: segmentLength
    });
    length += segmentLength;
  }

  return {
    ...config,
    segments,
    length
  };
}

function sampleLane(lane, distance) {
  const clampedDistance = clamp(distance, 0, lane.length);
  const segment = lane.segments.find(
    (candidate) =>
      clampedDistance >= candidate.start && clampedDistance <= candidate.start + candidate.length
  ) || lane.segments[lane.segments.length - 1];
  const localDistance = clampedDistance - segment.start;
  const t = segment.length === 0 ? 0 : localDistance / segment.length;
  const x = segment.from.x + (segment.to.x - segment.from.x) * t;
  const y = segment.from.y + (segment.to.y - segment.from.y) * t;
  const heading = Math.atan2(segment.to.y - segment.from.y, segment.to.x - segment.from.x);
  return { x, y, heading };
}

function applyPatrol(index) {
  state.patrolIndex = index;
  state.patrol = patrolPresets[index];
  state.lanes = state.patrol.lanes.map(createLane);
  buildRoadTiles();
  elements.patrolLine.textContent = `${state.patrol.name}: ${state.patrol.subtitle}`;
}

function advancePatrol() {
  applyPatrol((state.patrolIndex + 1) % patrolPresets.length);
  resetMissionBoard();
  statusCopy(`New patrol deployed: ${state.patrol.name}.`);
  showToast(`${state.patrol.name} loaded`);
}

function buildRoadTiles() {
  const roadTiles = new Set();

  for (const lane of state.lanes) {
    for (const segment of lane.segments) {
      const steps = Math.max(8, Math.ceil(segment.length * 10));

      for (let step = 0; step <= steps; step += 1) {
        const t = step / steps;
        const x = segment.from.x + (segment.to.x - segment.from.x) * t;
        const y = segment.from.y + (segment.to.y - segment.from.y) * t;

        for (let dx = -lane.roadRadius; dx <= lane.roadRadius; dx += 1) {
          for (let dy = -lane.roadRadius; dy <= lane.roadRadius; dy += 1) {
            roadTiles.add(`${Math.round(x + dx)},${Math.round(y + dy)}`);
          }
        }
      }
    }
  }

  state.roadTiles = roadTiles;
}

function activeWords(excludeVehicleId = null) {
  return new Set(
    state.vehicles
      .filter((vehicle) => vehicle.id !== excludeVehicleId)
      .map((vehicle) => vehicle.wordInfo.word)
  );
}

function repeatBlocklist(poolSize) {
  if (poolSize <= 1) {
    return new Set();
  }

  const repeatAllowance = Math.max(1, Math.floor(poolSize * TARGET_REPEAT_RATE));
  const blockedCount = Math.max(0, poolSize - repeatAllowance);
  return new Set(state.recentTargetWords.slice(0, blockedCount));
}

function assignWord(vehicle, options = {}) {
  const difficulties = options.difficulties || difficultyList;
  const avoidRecent = options.avoidRecent !== false;
  const active = activeWords(vehicle.id);
  const eligible = wordBank.filter(
    (entry) => difficulties.includes(entry.difficulty) && !active.has(entry.word)
  );

  const recent = avoidRecent ? repeatBlocklist(eligible.length) : new Set();
  let candidates = eligible.filter((entry) => !recent.has(entry.word));

  if (!candidates.length) {
    candidates = wordBank.filter(
      (entry) => difficulties.includes(entry.difficulty) && !active.has(entry.word)
    );
  }

  if (!candidates.length) {
    candidates = wordBank.filter((entry) => !active.has(entry.word));
  }

  const wordInfo = randomItem(candidates.length ? candidates : wordBank);
  vehicle.wordInfo = {
    ...wordInfo,
    points: pointsByDifficulty[wordInfo.difficulty]
  };
}

function createVehicle(id, lane, typeId, slotIndex) {
  const type = vehicleTypes[typeId];
  const convoyCount = lane.convoy.length;
  const spacing = lane.length / (convoyCount + 1);
  const baseDistance = spacing * (slotIndex + 1);
  const distance =
    lane.direction >= 0
      ? baseDistance + randomBetween(-0.3, 0.3)
      : lane.length - baseDistance + randomBetween(-0.3, 0.3);

  const vehicle = {
    id,
    laneIndex: state.lanes.findIndex((candidate) => candidate.id === lane.id),
    laneId: lane.id,
    type,
    distance,
    direction: lane.direction >= 0 ? 1 : -1,
    speed: randomBetween(type.speedMin, type.speedMax) * lane.speedScale,
    explodingUntil: 0,
    highlightUntil: 0,
    missFlashUntil: 0,
    bodyBox: null,
    labelBox: null
  };

  assignWord(vehicle, { avoidRecent: false });
  return vehicle;
}

function setupVehicles() {
  state.vehicles = [];
  let nextId = 1;

  for (const lane of state.lanes) {
    lane.convoy.forEach((typeId, slotIndex) => {
      state.vehicles.push(createVehicle(`vehicle-${nextId++}`, lane, typeId, slotIndex));
    });
  }
}

function refreshVehiclePose(vehicle) {
  const lane = state.lanes[vehicle.laneIndex];
  const pose = sampleLane(lane, vehicle.distance);
  vehicle.worldX = pose.x;
  vehicle.worldY = pose.y;
  vehicle.heading = vehicle.direction >= 0 ? pose.heading : pose.heading + Math.PI;
  vehicle.depth = pose.x + pose.y;
}

function currentTarget() {
  return state.vehicles.find((vehicle) => vehicle.id === state.targetVehicleId) || null;
}

function statusCopy(text) {
  state.statusText = text;

  if (!state.paused) {
    elements.statusLine.textContent = text;
  }
}

function showToast(text) {
  const toast = elements.toastTemplate.content.firstElementChild.cloneNode(true);
  toast.textContent = text;
  document.body.append(toast);
  window.setTimeout(() => {
    toast.remove();
  }, 1900);
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json"
    },
    ...options
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
}

async function loadSave() {
  state.save = await fetchJson(SAVE_URL);
  renderStats();
}

async function persistSave() {
  if (!state.save) {
    return;
  }

  state.save = await fetchJson(SAVE_URL, {
    method: "POST",
    body: JSON.stringify(state.save)
  });
}

function renderStats() {
  elements.scoreValue.textContent = state.save.totalScore;
  elements.hitsValue.textContent = state.save.totalHits;
  elements.missesValue.textContent = state.save.totalMisses;
  elements.streakValue.textContent = state.save.currentStreak;
  elements.scoreValue.classList.toggle("score-negative", state.save.totalScore < 0);
}

function renderPauseButton() {
  elements.pauseButton.textContent = state.paused ? "Resume" : "Pause";
  elements.pauseButton.classList.toggle("pause-active", state.paused);
}

function buildTtsUrl(text) {
  const params = new URLSearchParams({
    text,
    voice: "af_nicole",
    speed: "0.94"
  });
  return `${TTS_URL}?${params.toString()}`;
}

function stopPrompt() {
  state.promptToken += 1;

  if (state.currentAudio) {
    state.currentAudio.pause();
    state.currentAudio.src = "";
    state.currentAudio = null;
  }

  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

function fallbackSpeak(text, token) {
  if (!("speechSynthesis" in window) || token !== state.promptToken) {
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.94;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

async function speakPrompt(text, options = {}) {
  const onStart = options.onStart;
  stopPrompt();
  const token = state.promptToken;
  const audio = new Audio(buildTtsUrl(text));
  state.currentAudio = audio;

  try {
    await audio.play();
    if (token === state.promptToken) {
      onStart?.();
    }
  } catch (error) {
    if (token === state.promptToken) {
      onStart?.();
    }
    fallbackSpeak(text, token);
    return;
  }

  audio.onended = () => {
    if (state.currentAudio === audio) {
      state.currentAudio = null;
    }
  };
}

function updateTargetDisplay() {
  const target = currentTarget();

  if (!target) {
    elements.targetWord.textContent = "Scanning...";
    elements.targetMeta.textContent = "Selecting the next callout";
    return;
  }

  const points = `${target.wordInfo.points} pts`;
  const lane = state.lanes[target.laneIndex];
  elements.targetWord.textContent = target.wordInfo.word;
  elements.targetMeta.textContent = `${points} • ${formatDifficulty(target.wordInfo.difficulty)} • ${target.type.name} • ${lane.role}`;
}

function activateTargetWindow(targetId) {
  const target = currentTarget();

  if (!target || target.id !== targetId || state.status !== "prompting") {
    return;
  }

  const activationTime = performance.now();
  state.now = activationTime;
  state.status = "active";
  state.targetDeadline = activationTime + TARGET_WINDOW_MS;
  state.promptFallbackAt = 0;
  statusCopy("Pan the battlefield and blast the labeled target before time expires.");
  updateTimer();
}

function togglePause(force) {
  const nextPaused = typeof force === "boolean" ? force : !state.paused;

  if (nextPaused === state.paused) {
    return;
  }

  state.paused = nextPaused;
  pressedKeys.clear();
  setKeyboardPan();

  if (state.drag) {
    state.drag = null;
    elements.canvas.classList.remove("dragging");
  }

  if (state.paused) {
    stopPrompt();
    elements.statusLine.textContent = "Paused. Press Resume to continue the hunt.";
    elements.timerValue.textContent = "Paused";
  } else {
    elements.statusLine.textContent = state.statusText;
    updateTimer();
  }

  renderPauseButton();
}

function placementForVehicle(vehicle) {
  const point = worldToScreen(vehicle.worldX, vehicle.worldY);
  const visible =
    point.x >= 90 &&
    point.x <= state.viewport.width - 90 &&
    point.y >= 70 &&
    point.y <= state.viewport.height - 70;
  const edge =
    point.x >= -40 &&
    point.x <= state.viewport.width + 40 &&
    point.y >= -30 &&
    point.y <= state.viewport.height + 30;
  const near =
    point.x >= -220 &&
    point.x <= state.viewport.width + 220 &&
    point.y >= -180 &&
    point.y <= state.viewport.height + 180;

  if (visible) {
    return "visible";
  }
  if (edge) {
    return "edge";
  }
  if (near) {
    return "near";
  }
  return "far";
}

function placementProfile() {
  if (state.assistRounds >= 2) {
    return {
      placements: ["visible", "edge", "near"],
      farPenalty: 160,
      idealCenterDistance: 110,
      minCenterDistance: 70,
      maxCenterDistance: 300,
      laneRepeatPenalty: 24
    };
  }

  if (state.assistRounds === 1) {
    return {
      placements: ["edge", "visible", "near"],
      farPenalty: 100,
      idealCenterDistance: 150,
      minCenterDistance: 90,
      maxCenterDistance: 380,
      laneRepeatPenalty: 34
    };
  }

  if (state.save.currentStreak >= 4) {
    return {
      placements: ["near", "edge", "visible", "far"],
      farPenalty: 40,
      idealCenterDistance: 280,
      minCenterDistance: 180,
      maxCenterDistance: 620,
      laneRepeatPenalty: 44
    };
  }

  if (state.save.currentStreak >= 2) {
    return {
      placements: ["edge", "near", "visible", "far"],
      farPenalty: 60,
      idealCenterDistance: 220,
      minCenterDistance: 140,
      maxCenterDistance: 500,
      laneRepeatPenalty: 40
    };
  }

  return {
    placements: ["edge", "visible", "near"],
    farPenalty: 120,
    idealCenterDistance: 135,
    minCenterDistance: 90,
    maxCenterDistance: 340,
    laneRepeatPenalty: 32
  };
}

function vehicleTargetWeight(vehicle, profile) {
  const placement = placementForVehicle(vehicle);
  const point = worldToScreen(vehicle.worldX, vehicle.worldY);
  const centerDistance = Math.hypot(point.x - state.viewport.width / 2, point.y - state.viewport.height / 2);
  const placementRank = profile.placements.indexOf(placement);
  const placementWeight = placementRank === -1 ? 8 : 92 - placementRank * 20;
  const centerPenalty = Math.abs(centerDistance - profile.idealCenterDistance) * 0.08;
  let weight = placementWeight - centerPenalty;

  if (centerDistance < profile.minCenterDistance) {
    weight -= (profile.minCenterDistance - centerDistance) * 0.28;
  }

  if (centerDistance > profile.maxCenterDistance) {
    weight -= (centerDistance - profile.maxCenterDistance) * 0.16;
  }

  if (placement === "far") {
    weight -= profile.farPenalty;
  }
  if (vehicle.id === state.lastTargetVehicleId) {
    weight -= 80;
  }
  if (vehicle.laneIndex === state.lastTargetLaneIndex) {
    weight -= profile.laneRepeatPenalty;
  }

  if (vehicle.type.id === "tank" || vehicle.type.id === "humvee") {
    weight += 6;
  }

  return Math.max(weight, 2);
}

function availableDifficultyCounts(excludeVehicleId = null) {
  const active = activeWords(excludeVehicleId);
  const counts = Object.fromEntries(difficultyList.map((difficulty) => [difficulty, 0]));

  for (const entry of wordBank) {
    if (!active.has(entry.word)) {
      counts[entry.difficulty] += 1;
    }
  }

  return counts;
}

function targetDifficultyProfile() {
  if (state.assistRounds >= 2) {
    return difficultyMix.assist2;
  }

  if (state.assistRounds === 1) {
    return difficultyMix.assist1;
  }

  return difficultyMix.default;
}

// Keep vocabulary varied: every round can pull from any tier, but recent repeats
// are heavily penalized so the player gets a healthier mix of easy, medium, and hard words.
function pickTargetDifficulty(vehicle) {
  const counts = availableDifficultyCounts(vehicle.id);
  const recent = state.recentTargetDifficulties;
  const weights = targetDifficultyProfile();
  const weighted = difficultyList.map((difficulty) => {
    if (!counts[difficulty]) {
      return { item: difficulty, weight: 0 };
    }

    let weight = weights[difficulty];

    if (recent[0] === difficulty) {
      weight *= 0.22;
    }

    if (recent[1] === difficulty) {
      weight *= 0.55;
    }

    if (recent.slice(0, 4).filter((item) => item === difficulty).length >= 2) {
      weight *= 0.5;
    }

    return { item: difficulty, weight };
  });

  return weightedPick(weighted) || randomItem(difficultyList.filter((difficulty) => counts[difficulty] > 0));
}

function pickNextTarget() {
  const available = state.vehicles.filter((vehicle) => state.now >= vehicle.explodingUntil);

  if (!available.length) {
    state.targetVehicleId = null;
    state.status = "boot";
    updateTargetDisplay();
    return;
  }

  const profile = placementProfile();
  const weighted = available.map((vehicle) => ({
    item: vehicle,
    weight: vehicleTargetWeight(vehicle, profile)
  }));
  const target = weightedPick(weighted) || available[0];
  const requestedDifficulty = pickTargetDifficulty(target);

  assignWord(target, {
    difficulties: requestedDifficulty ? [requestedDifficulty] : difficultyList
  });
  pushRecentTargetDifficulty(target.wordInfo.difficulty);

  state.targetVehicleId = target.id;
  state.targetDeadline = 0;
  state.promptFallbackAt = state.now + PROMPT_FALLBACK_MS;
  state.nextTargetAt = 0;
  state.status = "prompting";
  state.lastTargetVehicleId = target.id;
  state.lastTargetLaneIndex = target.laneIndex;

  if (state.lastOutcome === "hit" && state.assistRounds > 0) {
    state.assistRounds -= 1;
  }

  updateTargetDisplay();
  statusCopy("Listen for the callout, then sweep the battlefield.");
  updateTimer();
  speakPrompt(`Target ${target.wordInfo.word}. ${target.wordInfo.points} points. Twenty seconds.`, {
    onStart: () => {
      activateTargetWindow(target.id);
    }
  }).catch(console.error);
}

function resetMissionBoard() {
  stopPrompt();
  state.particles = [];
  state.targetVehicleId = null;
  state.targetDeadline = 0;
  state.nextTargetAt = 0;
  state.status = "boot";
  state.lastTargetVehicleId = null;
  state.lastTargetLaneIndex = null;
  state.recentTargetWords = [];
  state.recentTargetDifficulties = [];
  setupVehicles();
  state.vehicles.forEach(refreshVehiclePose);
  centerCamera();
  snapCameraToTarget();
  pickNextTarget();
}

function createParticleBurst(vehicle) {
  const origin = worldToScreen(vehicle.worldX, vehicle.worldY);
  const colors = ["#ffd166", "#f08b41", "#fff4ce", "#ff6b4a", "#f9a63c"];

  for (let index = 0; index < 22; index += 1) {
    const angle = (Math.PI * 2 * index) / 22 + Math.random() * 0.16;
    const speed = randomBetween(55, 150);
    state.particles.push({
      x: origin.x,
      y: origin.y - 24,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 20,
      size: randomBetween(3, 7),
      life: randomBetween(0.45, 0.78),
      maxLife: 0,
      color: randomItem(colors)
    });
  }

  state.particles.forEach((particle) => {
    if (particle.maxLife === 0) {
      particle.maxLife = particle.life;
    }
  });
}

function scoreHit(vehicle) {
  stopPrompt();
  state.status = "transition";
  state.save.totalScore += vehicle.wordInfo.points;
  state.save.totalHits += 1;
  state.save.roundsCleared += 1;
  state.save.currentStreak += 1;
  state.save.bestStreak = Math.max(state.save.bestStreak, state.save.currentStreak);
  state.lastOutcome = "hit";
  renderStats();
  pushRecentTargetWord(vehicle.wordInfo.word);
  vehicle.explodingUntil = state.now + 700;
  vehicle.highlightUntil = state.now + 900;
  createParticleBurst(vehicle);
  showToast(`+${vehicle.wordInfo.points} for ${vehicle.wordInfo.word}`);
  statusCopy(`Direct hit. The convoy is being re-tasked.`);
  state.nextTargetAt = state.now + HIT_PAUSE_MS;
  persistSave().catch(console.error);
}

function scoreMiss(vehicle) {
  stopPrompt();
  state.status = "revealing";
  state.save.totalScore -= vehicle.wordInfo.points;
  state.save.totalMisses += 1;
  state.save.currentStreak = 0;
  state.lastOutcome = "miss";
  state.assistRounds = 2;
  renderStats();
  pushRecentTargetWord(vehicle.wordInfo.word);
  vehicle.highlightUntil = state.now + MISS_REVEAL_MS;
  vehicle.missFlashUntil = state.now + MISS_REVEAL_MS;
  focusCameraOn(vehicle.worldX, vehicle.worldY);
  showToast(`Missed ${vehicle.wordInfo.word}: -${vehicle.wordInfo.points}`);
  statusCopy(`Time expired. Watch where the missed target is moving.`);
  state.nextTargetAt = state.now + MISS_REVEAL_MS;
  persistSave().catch(console.error);
}

function recycleResolvedTarget() {
  const target = currentTarget();

  if (!target) {
    return;
  }

  target.highlightUntil = 0;
  target.missFlashUntil = 0;
  assignWord(target, { avoidRecent: false });
  state.promptFallbackAt = 0;
}

function advanceTargetCycle() {
  if (!state.nextTargetAt || state.now < state.nextTargetAt) {
    return;
  }

  recycleResolvedTarget();
  state.nextTargetAt = 0;
  pickNextTarget();
}

function updateVehicles(dt) {
  for (const vehicle of state.vehicles) {
    const lane = state.lanes[vehicle.laneIndex];
    vehicle.distance += vehicle.speed * vehicle.direction * dt;

    if (vehicle.distance > lane.length) {
      vehicle.distance = lane.length;
      vehicle.direction = -1;
    } else if (vehicle.distance < 0) {
      vehicle.distance = 0;
      vehicle.direction = 1;
    }

    refreshVehiclePose(vehicle);
  }
}

function updateParticles(dt) {
  state.particles = state.particles.filter((particle) => particle.life > 0);

  for (const particle of state.particles) {
    particle.life -= dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vy += 250 * dt;
  }
}

function updateCamera(dt) {
  const keyboardSpeed = 640;

  if (state.keyboardPan.x || state.keyboardPan.y) {
    state.camera.targetX = null;
    state.camera.targetY = null;
    state.camera.x += state.keyboardPan.x * keyboardSpeed * dt;
    state.camera.y += state.keyboardPan.y * keyboardSpeed * dt;
  }

  if (state.camera.targetX !== null && state.camera.targetY !== null) {
    const easing = 1 - Math.exp(-4.5 * dt);
    state.camera.x += (state.camera.targetX - state.camera.x) * easing;
    state.camera.y += (state.camera.targetY - state.camera.y) * easing;
  }

  clampCamera();
}

function updateTimer() {
  if (state.status === "prompting") {
    elements.timerValue.textContent = "Listen";
    elements.timerFill.style.transform = "scaleX(1)";
    return;
  }

  const remainingMs = Math.max(0, state.targetDeadline - state.now);
  const remainingRatio =
    state.targetDeadline === 0 ? 0 : Math.min(1, Math.max(0, remainingMs / TARGET_WINDOW_MS));

  elements.timerValue.textContent = `${(remainingMs / 1000).toFixed(1)}s`;
  elements.timerFill.style.transform = `scaleX(${remainingRatio})`;
}

function terrainInfluence(x, y) {
  const influence = {
    ridge: 0,
    scrub: 0,
    wadi: 0,
    pad: 0
  };

  for (const zone of state.patrol.zones) {
    const dx = (x - zone.x) / zone.rx;
    const dy = (y - zone.y) / zone.ry;
    const distance = dx * dx + dy * dy;

    if (distance < 1) {
      const strength = 1 - distance;
      influence[zone.type] = Math.max(influence[zone.type], strength);
    }
  }

  return influence;
}

function drawDiamond(x, y, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(x, y - TILE_H / 2);
  ctx.lineTo(x + TILE_W / 2, y);
  ctx.lineTo(x, y + TILE_H / 2);
  ctx.lineTo(x - TILE_W / 2, y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();

  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

function drawShrub(screenX, screenY, scale) {
  ctx.fillStyle = "#71804e";
  ctx.beginPath();
  ctx.ellipse(screenX - 5 * scale, screenY, 7 * scale, 4 * scale, -0.2, 0, Math.PI * 2);
  ctx.ellipse(screenX + 3 * scale, screenY - 2 * scale, 8 * scale, 5 * scale, 0.2, 0, Math.PI * 2);
  ctx.ellipse(screenX + 9 * scale, screenY + 1 * scale, 5 * scale, 3 * scale, 0.1, 0, Math.PI * 2);
  ctx.fill();
}

function drawRock(screenX, screenY, scale) {
  ctx.fillStyle = "#4a4437";
  ctx.beginPath();
  ctx.moveTo(screenX - 8 * scale, screenY + 1 * scale);
  ctx.lineTo(screenX - 3 * scale, screenY - 4 * scale);
  ctx.lineTo(screenX + 4 * scale, screenY - 5 * scale);
  ctx.lineTo(screenX + 8 * scale, screenY);
  ctx.lineTo(screenX + 2 * scale, screenY + 5 * scale);
  ctx.lineTo(screenX - 5 * scale, screenY + 4 * scale);
  ctx.closePath();
  ctx.fill();
}

function drawRoadRut(screenX, screenY, scale) {
  ctx.strokeStyle = "rgba(63, 50, 36, 0.24)";
  ctx.lineWidth = 1.1 * scale;
  ctx.beginPath();
  ctx.moveTo(screenX - 16 * scale, screenY - 2 * scale);
  ctx.lineTo(screenX + 4 * scale, screenY + 4 * scale);
  ctx.moveTo(screenX - 6 * scale, screenY - 6 * scale);
  ctx.lineTo(screenX + 12 * scale, screenY + 1 * scale);
  ctx.stroke();
}

function drawPadStencil(screenX, screenY, scale) {
  ctx.strokeStyle = "rgba(255, 255, 255, 0.09)";
  ctx.lineWidth = 1;
  ctx.strokeRect(screenX - 12 * scale, screenY - 6 * scale, 24 * scale, 12 * scale);
  ctx.beginPath();
  ctx.moveTo(screenX - 8 * scale, screenY);
  ctx.lineTo(screenX + 8 * scale, screenY);
  ctx.moveTo(screenX, screenY - 4 * scale);
  ctx.lineTo(screenX, screenY + 4 * scale);
  ctx.stroke();
}

function drawWadiCrack(screenX, screenY, scale) {
  ctx.strokeStyle = "rgba(88, 70, 46, 0.34)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(screenX - 10 * scale, screenY + 2 * scale);
  ctx.lineTo(screenX - 1 * scale, screenY - 1 * scale);
  ctx.lineTo(screenX + 6 * scale, screenY + 3 * scale);
  ctx.lineTo(screenX + 12 * scale, screenY + 1 * scale);
  ctx.stroke();
}

function drawContourAccent(screenX, screenY, scale) {
  ctx.strokeStyle = "rgba(33, 42, 29, 0.34)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(screenX - 18 * scale, screenY - 4 * scale);
  ctx.lineTo(screenX - 4 * scale, screenY);
  ctx.lineTo(screenX + 12 * scale, screenY + 4 * scale);
  ctx.stroke();
}

function drawGrassTuft(screenX, screenY, scale) {
  ctx.strokeStyle = "rgba(126, 148, 84, 0.55)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(screenX, screenY + 4 * scale);
  ctx.lineTo(screenX - 3 * scale, screenY - 2 * scale);
  ctx.moveTo(screenX, screenY + 4 * scale);
  ctx.lineTo(screenX, screenY - 4 * scale);
  ctx.moveTo(screenX, screenY + 4 * scale);
  ctx.lineTo(screenX + 3 * scale, screenY - 2 * scale);
  ctx.stroke();
}

function drawTerrain() {
  for (let row = 0; row < MAP_ROWS; row += 1) {
    for (let col = 0; col < MAP_COLS; col += 1) {
      const screen = worldToScreen(col, row);

      if (
        screen.x < -TILE_W ||
        screen.x > state.viewport.width + TILE_W ||
        screen.y < -TILE_H ||
        screen.y > state.viewport.height + TILE_H
      ) {
        continue;
      }

      const roadKey = `${col},${row}`;
      const onRoad = state.roadTiles.has(roadKey);
      const variation = noise(col, row);
      const zone = terrainInfluence(col, row);
      let fill = variation > 0.64 ? "#566941" : "#4a5d39";
      let stroke = "rgba(255,255,255,0.03)";

      if (zone.wadi > 0.35) {
        fill = zone.wadi > 0.62 ? "#6b5a40" : "#60533d";
        stroke = "rgba(210, 176, 120, 0.08)";
      } else if (zone.pad > 0.4) {
        fill = variation > 0.6 ? "#6b6453" : "#5f594a";
        stroke = "rgba(255,255,255,0.06)";
      } else if (zone.ridge > 0.38) {
        fill = variation > 0.55 ? "#5b6748" : "#4d5b3f";
        stroke = "rgba(255,255,255,0.05)";
      } else if (zone.scrub > 0.36) {
        fill = variation > 0.6 ? "#617749" : "#556a41";
        stroke = "rgba(255,255,255,0.04)";
      }

      if (onRoad) {
        fill = variation > 0.55 ? "#6f644f" : "#665b48";
        stroke = "rgba(250, 227, 167, 0.08)";
      }

      drawDiamond(screen.x, screen.y, fill, stroke);

      if (onRoad && variation > 0.34) {
        drawRoadRut(screen.x + 4, screen.y + 5, 0.9);
      }

      if (!onRoad && zone.pad > 0.5 && variation > 0.54) {
        drawPadStencil(screen.x, screen.y + 2, 0.84);
      }

      if (!onRoad && zone.ridge > 0.56 && variation > 0.56) {
        drawContourAccent(screen.x, screen.y, 1);
      }

      if (!onRoad && zone.scrub > 0.34 && variation > 0.76) {
        drawShrub(screen.x + 7, screen.y + 8, 0.72);
      } else if (!onRoad && zone.scrub > 0.26 && variation > 0.68) {
        drawGrassTuft(screen.x + 6, screen.y + 8, 0.9);
      } else if (!onRoad && zone.wadi > 0.4 && variation > 0.74) {
        drawWadiCrack(screen.x, screen.y + 1, 0.96);
      } else if (!onRoad && zone.ridge > 0.4 && variation > 0.68) {
        drawRock(screen.x + 6, screen.y + 7, 0.72);
      }
    }
  }
}

function drawCheckpoint(point, tone) {
  const screen = worldToScreen(point.x, point.y);
  ctx.fillStyle = tone;
  ctx.beginPath();
  ctx.arc(screen.x, screen.y - 8, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(screen.x, screen.y - 4);
  ctx.lineTo(screen.x, screen.y + 12);
  ctx.stroke();
}

function drawRoads() {
  for (const lane of state.lanes) {
    ctx.beginPath();

    lane.points.forEach((point, index) => {
      const screen = worldToScreen(point.x, point.y);
      if (index === 0) {
        ctx.moveTo(screen.x, screen.y);
      } else {
        ctx.lineTo(screen.x, screen.y);
      }
    });

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 38;
    ctx.strokeStyle = "rgba(50, 42, 31, 0.22)";
    ctx.stroke();

    ctx.lineWidth = 26;
    ctx.strokeStyle = lane.role === "armor"
      ? "rgba(149, 130, 95, 0.48)"
      : lane.role === "support" || lane.role === "haul"
        ? "rgba(138, 122, 97, 0.42)"
        : "rgba(127, 114, 88, 0.4)";
    ctx.stroke();

    ctx.setLineDash([12, 14]);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(236, 214, 160, 0.12)";
    ctx.stroke();
    ctx.setLineDash([]);

    drawCheckpoint(lane.points[0], "rgba(240, 200, 110, 0.88)");
    drawCheckpoint(lane.points[lane.points.length - 1], "rgba(151, 215, 122, 0.82)");
  }
}

function drawProp(prop) {
  const point = worldToScreen(prop.x, prop.y);
  const scale = prop.scale || 1;

  if (
    point.x < -80 ||
    point.x > state.viewport.width + 80 ||
    point.y < -80 ||
    point.y > state.viewport.height + 80
  ) {
    return;
  }

  ctx.save();
  ctx.translate(point.x, point.y);

  if (prop.type === "tent") {
    ctx.fillStyle = "#857356";
    ctx.beginPath();
    ctx.moveTo(0, -14 * scale);
    ctx.lineTo(18 * scale, -2 * scale);
    ctx.lineTo(0, 10 * scale);
    ctx.lineTo(-18 * scale, -2 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#6c5c43";
    ctx.beginPath();
    ctx.moveTo(0, -14 * scale);
    ctx.lineTo(0, 10 * scale);
    ctx.lineTo(-18 * scale, -2 * scale);
    ctx.closePath();
    ctx.fill();
  } else if (prop.type === "crate") {
    ctx.fillStyle = "#6e5a3c";
    ctx.fillRect(-10 * scale, -8 * scale, 20 * scale, 14 * scale);
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.strokeRect(-10 * scale, -8 * scale, 20 * scale, 14 * scale);
  } else if (prop.type === "tower") {
    ctx.strokeStyle = "#cbb98a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 10 * scale);
    ctx.lineTo(0, -26 * scale);
    ctx.stroke();
    ctx.fillStyle = "#d7c693";
    ctx.beginPath();
    ctx.moveTo(0, -30 * scale);
    ctx.lineTo(10 * scale, -18 * scale);
    ctx.lineTo(-10 * scale, -18 * scale);
    ctx.closePath();
    ctx.fill();
  } else if (prop.type === "fuel") {
    ctx.fillStyle = "#7b8c99";
    ctx.beginPath();
    ctx.ellipse(-7 * scale, 0, 5 * scale, 8 * scale, 0, 0, Math.PI * 2);
    ctx.ellipse(7 * scale, -2 * scale, 5 * scale, 8 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (prop.type === "rock") {
    drawRock(0, 0, 1.1 * scale);
  } else if (prop.type === "berm") {
    ctx.fillStyle = "#63563f";
    ctx.beginPath();
    ctx.ellipse(0, 0, 22 * scale, 8 * scale, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#74664b";
    ctx.beginPath();
    ctx.ellipse(-4 * scale, -2 * scale, 15 * scale, 5 * scale, -0.25, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawProps() {
  const sorted = [...state.patrol.props].sort((left, right) => left.x + left.y - (right.x + right.y));
  for (const prop of sorted) {
    drawProp(prop);
  }
}

function roundedRectPath(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawWheel(x, y, radius) {
  ctx.fillStyle = "#26251f";
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#5b5a51";
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.48, 0, Math.PI * 2);
  ctx.fill();
}

function drawTrack(x, y, width, height) {
  roundedRectPath(x, y, width, height, height / 2);
  ctx.fillStyle = "#2f3428";
  ctx.fill();
}

function drawTankShape(vehicle) {
  drawTrack(-28, -7, 18, 18);
  drawTrack(10, -7, 18, 18);
  ctx.fillStyle = vehicle.type.color;
  ctx.beginPath();
  ctx.moveTo(-20, -10);
  ctx.lineTo(16, -10);
  ctx.lineTo(24, 0);
  ctx.lineTo(16, 10);
  ctx.lineTo(-22, 8);
  ctx.lineTo(-26, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = vehicle.type.highlight;
  ctx.beginPath();
  ctx.arc(-2, 0, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = vehicle.type.accent;
  ctx.fillRect(-24, -3, 6, 6);
  ctx.fillRect(4, -2, 28, 4);
  ctx.fillRect(-14, -14, 8, 4);
  ctx.fillRect(-5, -2, 7, 3);
}

function drawHumveeShape(vehicle) {
  drawWheel(-16, 9, 4.5);
  drawWheel(-4, 10, 4.5);
  drawWheel(10, 10, 4.5);
  drawWheel(22, 9, 4.5);
  ctx.fillStyle = vehicle.type.color;
  ctx.beginPath();
  ctx.moveTo(-22, -7);
  ctx.lineTo(10, -8);
  ctx.lineTo(24, 0);
  ctx.lineTo(22, 6);
  ctx.lineTo(-20, 7);
  ctx.lineTo(-26, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = vehicle.type.highlight;
  ctx.fillRect(-6, -15, 15, 9);
  ctx.fillRect(11, -5, 7, 5);
  ctx.fillStyle = vehicle.type.accent;
  ctx.fillRect(-21, 5, 42, 4);
  ctx.fillRect(18, -5, 7, 3);
}

function drawTankerShape(vehicle) {
  drawWheel(-20, 9, 4.8);
  drawWheel(-6, 9, 4.8);
  drawWheel(14, 10, 4.8);
  drawWheel(26, 10, 4.8);
  ctx.fillStyle = vehicle.type.color;
  roundedRectPath(-27, -8, 21, 16, 5);
  ctx.fill();
  ctx.fillStyle = "#98907d";
  ctx.beginPath();
  ctx.ellipse(12, -1, 17, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = vehicle.type.accent;
  ctx.fillRect(-25, -10, 12, 3);
  ctx.fillRect(-25, 6, 50, 4);
  ctx.fillRect(0, -1, 26, 2);
  ctx.fillRect(4, -11, 12, 3);
}

function drawArtilleryShape(vehicle) {
  drawWheel(-14, 8, 4.5);
  drawWheel(-2, 8, 4.5);
  drawWheel(18, 9, 4.5);
  ctx.fillStyle = vehicle.type.color;
  roundedRectPath(-20, -7, 24, 14, 4);
  ctx.fill();
  ctx.fillStyle = vehicle.type.accent;
  ctx.fillRect(2, -2, 22, 4);
  ctx.beginPath();
  ctx.moveTo(18, -2);
  ctx.lineTo(34, -14);
  ctx.lineTo(36, -10);
  ctx.lineTo(22, 1);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(-10, 4, 18, 3);
  ctx.fillRect(24, 2, 12, 3);
}

function drawLauncherShape(vehicle) {
  drawWheel(-18, 9, 4.5);
  drawWheel(-4, 9, 4.5);
  drawWheel(10, 9, 4.5);
  drawWheel(24, 9, 4.5);
  ctx.fillStyle = vehicle.type.color;
  roundedRectPath(-24, -7, 44, 15, 4);
  ctx.fill();
  ctx.fillStyle = vehicle.type.highlight;
  ctx.fillRect(-22, -12, 12, 6);
  ctx.fillStyle = vehicle.type.accent;
  ctx.save();
  ctx.translate(8, -12);
  ctx.rotate(-0.18);
  ctx.fillRect(0, -5, 22, 10);
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = 1;
  ctx.strokeRect(0, -5, 22, 10);
  ctx.beginPath();
  ctx.moveTo(5, -5);
  ctx.lineTo(5, 5);
  ctx.moveTo(11, -5);
  ctx.lineTo(11, 5);
  ctx.moveTo(17, -5);
  ctx.lineTo(17, 5);
  ctx.stroke();
  ctx.restore();
}

function drawDustTrail(vehicle, point, screenAngle) {
  const drift = clamp(vehicle.speed / 1.15, 0.45, 1);
  const roleAlpha =
    vehicle.type.id === "humvee" || vehicle.type.id === "tanker"
      ? 0.12
      : vehicle.type.id === "tank"
        ? 0.08
        : 0.1;

  ctx.save();
  ctx.translate(point.x, point.y + 4);
  ctx.rotate(screenAngle + Math.PI);

  for (let index = 0; index < 3; index += 1) {
    const t = index / 2;
    const cloudX = lerp(20, 54, t) * drift;
    const cloudY = (index - 1) * 6;
    const cloudW = lerp(10, 22, t);
    const cloudH = lerp(5, 11, t);
    ctx.fillStyle = `rgba(193, 171, 125, ${roleAlpha - t * 0.03})`;
    ctx.beginPath();
    ctx.ellipse(cloudX, cloudY, cloudW, cloudH, 0.12, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawVehicleBody(vehicle, point, screenAngle) {
  ctx.save();
  ctx.translate(point.x, point.y);
  ctx.rotate(screenAngle);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  const flashAlpha = vehicle.missFlashUntil > state.now ? 0.32 + Math.sin(state.now / 90) * 0.18 : 0;
  ctx.fillStyle = `rgba(0, 0, 0, ${vehicle.missFlashUntil > state.now ? 0.34 : 0.24})`;
  ctx.beginPath();
  ctx.ellipse(0, 14, vehicle.type.hitW * 0.44, 11, 0, 0, Math.PI * 2);
  ctx.fill();

  if (flashAlpha > 0.05) {
    ctx.fillStyle = `rgba(255, 127, 102, ${flashAlpha})`;
    ctx.beginPath();
    ctx.ellipse(0, 12, vehicle.type.hitW * 0.54, 13, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  if (vehicle.type.id === "tank") {
    drawTankShape(vehicle);
  } else if (vehicle.type.id === "humvee") {
    drawHumveeShape(vehicle);
  } else if (vehicle.type.id === "tanker") {
    drawTankerShape(vehicle);
  } else if (vehicle.type.id === "artillery") {
    drawArtilleryShape(vehicle);
  } else {
    drawLauncherShape(vehicle);
  }

  ctx.restore();
}

function drawLabel(vehicle, point) {
  const word = vehicle.wordInfo.word;
  const isReveal = vehicle.highlightUntil > state.now;
  ctx.font = "bold 14px Trebuchet MS, sans-serif";
  const pillWidth = Math.max(88, Math.ceil(ctx.measureText(word).width) + 30);
  const x = point.x - pillWidth / 2;
  const y = point.y - 63;

  ctx.strokeStyle = isReveal ? "rgba(255, 140, 92, 0.9)" : "rgba(255,255,255,0.12)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(point.x, y + 28);
  ctx.lineTo(point.x, point.y - 18);
  ctx.stroke();

  roundedRectPath(x, y, pillWidth, 28, 12);
  ctx.fillStyle = isReveal ? "rgba(255, 239, 181, 0.96)" : "rgba(11, 17, 12, 0.84)";
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(point.x - 8, y + 28);
  ctx.lineTo(point.x + 8, y + 28);
  ctx.lineTo(point.x, y + 38);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = isReveal ? "#2d2310" : "#e9f2d8";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(word, point.x, y + 14);

  vehicle.labelBox = { x, y, width: pillWidth, height: 38 };
}

function drawRevealMarker(point) {
  const pulse = 1 + Math.sin(state.now / 115) * 0.14;
  ctx.save();
  ctx.strokeStyle = "rgba(255, 106, 77, 0.95)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(point.x, point.y - 12, 30 * pulse, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "rgba(255, 106, 77, 0.85)";
  ctx.beginPath();
  ctx.moveTo(point.x, point.y - 58);
  ctx.lineTo(point.x + 12, point.y - 78);
  ctx.lineTo(point.x - 12, point.y - 78);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawVehicles() {
  const sorted = [...state.vehicles].sort((left, right) => left.depth - right.depth);

  for (const vehicle of sorted) {
    const hidden = state.now < vehicle.explodingUntil;
    const point = worldToScreen(vehicle.worldX, vehicle.worldY);
    const ahead = worldToScreen(
      vehicle.worldX + Math.cos(vehicle.heading) * 0.35,
      vehicle.worldY + Math.sin(vehicle.heading) * 0.35
    );
    const screenAngle = Math.atan2(ahead.y - point.y, ahead.x - point.x);

    vehicle.bodyBox = {
      x: point.x - vehicle.type.hitW / 2,
      y: point.y - vehicle.type.hitH / 2,
      width: vehicle.type.hitW,
      height: vehicle.type.hitH
    };

    if (!hidden) {
      drawDustTrail(vehicle, point, screenAngle);
      drawVehicleBody(vehicle, point, screenAngle);
      drawLabel(vehicle, point);
    } else {
      vehicle.labelBox = null;
    }

    if (vehicle.highlightUntil > state.now) {
      drawRevealMarker(point);
    }
  }
}

function drawParticles() {
  for (const particle of state.particles) {
    const alpha = particle.maxLife === 0 ? 0 : Math.max(0, particle.life / particle.maxLife);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function drawPauseOverlay() {
  ctx.fillStyle = "rgba(4, 8, 5, 0.42)";
  ctx.fillRect(0, 0, state.viewport.width, state.viewport.height);

  const boxWidth = 280;
  const boxHeight = 110;
  const boxX = state.viewport.width / 2 - boxWidth / 2;
  const boxY = state.viewport.height / 2 - boxHeight / 2;

  roundedRectPath(boxX, boxY, boxWidth, boxHeight, 20);
  ctx.fillStyle = "rgba(13, 20, 14, 0.9)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = "#fff0b8";
  ctx.font = "bold 28px Trebuchet MS, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Paused", state.viewport.width / 2, boxY + 40);

  ctx.fillStyle = "rgba(234, 241, 218, 0.78)";
  ctx.font = "16px Trebuchet MS, sans-serif";
  ctx.fillText("Press Resume to continue the hunt.", state.viewport.width / 2, boxY + 76);
}

function render() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.clearRect(0, 0, state.viewport.width, state.viewport.height);

  const sky = ctx.createLinearGradient(0, 0, 0, state.viewport.height);
  sky.addColorStop(0, "rgba(136, 156, 102, 0.32)");
  sky.addColorStop(1, "rgba(31, 42, 24, 0)");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, state.viewport.width, state.viewport.height);

  drawTerrain();
  drawRoads();
  drawProps();
  drawVehicles();
  drawParticles();

  if (state.paused) {
    drawPauseOverlay();
  }
}

function vehicleAtPoint(point) {
  const sorted = [...state.vehicles].sort((left, right) => right.depth - left.depth);

  return (
    sorted.find((vehicle) => {
      if (state.now < vehicle.explodingUntil) {
        return false;
      }

      const inLabel =
        vehicle.labelBox &&
        point.x >= vehicle.labelBox.x &&
        point.x <= vehicle.labelBox.x + vehicle.labelBox.width &&
        point.y >= vehicle.labelBox.y &&
        point.y <= vehicle.labelBox.y + vehicle.labelBox.height;

      const inBody =
        vehicle.bodyBox &&
        point.x >= vehicle.bodyBox.x &&
        point.x <= vehicle.bodyBox.x + vehicle.bodyBox.width &&
        point.y >= vehicle.bodyBox.y &&
        point.y <= vehicle.bodyBox.y + vehicle.bodyBox.height;

      return inLabel || inBody;
    }) || null
  );
}

function onVehicleClicked(vehicle) {
  const target = currentTarget();

  if (state.paused || !target || state.status !== "active") {
    return;
  }

  if (vehicle.id !== target.id) {
    statusCopy(`"${vehicle.wordInfo.word}" is not the target. Keep sweeping the map.`);
    showToast(`Not ${vehicle.wordInfo.word}`);
    return;
  }

  scoreHit(vehicle);
}

function handleTimeout() {
  const target = currentTarget();

  if (state.paused || !target || state.status !== "active") {
    return;
  }

  scoreMiss(target);
}

function resizeCanvas() {
  const rect = elements.canvas.getBoundingClientRect();
  state.viewport.width = rect.width;
  state.viewport.height = rect.height;
  elements.canvas.width = rect.width * DPR;
  elements.canvas.height = rect.height * DPR;

  const corners = [
    worldToScreenRaw(0, 0),
    worldToScreenRaw(MAP_COLS, 0),
    worldToScreenRaw(0, MAP_ROWS),
    worldToScreenRaw(MAP_COLS, MAP_ROWS)
  ];

  state.mapBounds = {
    minX: Math.min(...corners.map((corner) => corner.x)),
    maxX: Math.max(...corners.map((corner) => corner.x)),
    minY: Math.min(...corners.map((corner) => corner.y)),
    maxY: Math.max(...corners.map((corner) => corner.y))
  };

  clampCamera();
}

function setKeyboardPan() {
  let x = 0;
  let y = 0;

  if (pressedKeys.has("ArrowLeft") || pressedKeys.has("a")) {
    x += 1;
  }
  if (pressedKeys.has("ArrowRight") || pressedKeys.has("d")) {
    x -= 1;
  }
  if (pressedKeys.has("ArrowUp") || pressedKeys.has("w")) {
    y += 1;
  }
  if (pressedKeys.has("ArrowDown") || pressedKeys.has("s")) {
    y -= 1;
  }

  state.keyboardPan = { x, y };
}

function bindCanvas() {
  elements.canvas.addEventListener("pointerdown", (event) => {
    if (state.paused) {
      return;
    }

    const point = getCanvasPoint(event);
    elements.canvas.classList.add("dragging");
    elements.canvas.setPointerCapture(event.pointerId);
    state.drag = {
      pointerId: event.pointerId,
      startX: point.x,
      startY: point.y,
      cameraX: state.camera.x,
      cameraY: state.camera.y,
      moved: false
    };
  });

  elements.canvas.addEventListener("pointermove", (event) => {
    if (!state.drag || state.drag.pointerId !== event.pointerId) {
      return;
    }

    const point = getCanvasPoint(event);
    const dx = point.x - state.drag.startX;
    const dy = point.y - state.drag.startY;

    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      state.drag.moved = true;
    }

    state.camera.targetX = null;
    state.camera.targetY = null;
    state.camera.x = state.drag.cameraX + dx;
    state.camera.y = state.drag.cameraY + dy;
    clampCamera();
  });

  elements.canvas.addEventListener("pointerup", (event) => {
    if (!state.drag || state.drag.pointerId !== event.pointerId) {
      return;
    }

    const point = getCanvasPoint(event);
    const moved = state.drag.moved;
    state.drag = null;
    elements.canvas.classList.remove("dragging");
    elements.canvas.releasePointerCapture(event.pointerId);

    if (!moved) {
      const vehicle = vehicleAtPoint(point);
      if (vehicle) {
        onVehicleClicked(vehicle);
      }
    }
  });

  elements.canvas.addEventListener("pointercancel", () => {
    state.drag = null;
    elements.canvas.classList.remove("dragging");
  });
}

function bindControls() {
  elements.pauseButton.addEventListener("click", () => {
    togglePause();
  });

  elements.repeatButton.addEventListener("click", () => {
    const target = currentTarget();
    if (!target || !["prompting", "active"].includes(state.status)) {
      return;
    }

    const shouldActivateOnRepeat = state.status === "prompting";

    speakPrompt(`Target ${target.wordInfo.word}. ${target.wordInfo.points} points. Twenty seconds.`, {
      onStart: () => {
        if (shouldActivateOnRepeat) {
          activateTargetWindow(target.id);
        }
      }
    }).catch(console.error);
  });

  elements.newPatrolButton.addEventListener("click", () => {
    togglePause(false);
    advancePatrol();
  });

  elements.centerButton.addEventListener("click", () => {
    centerCamera();

    if (state.paused) {
      snapCameraToTarget();
    }
  });

  elements.resetButton.addEventListener("click", async () => {
    togglePause(false);
    stopPrompt();
    state.save = await fetchJson(RESET_URL, { method: "POST" });
    renderStats();
    state.assistRounds = 0;
    applyPatrol(0);
    resetMissionBoard();
    statusCopy("V2 save reset. Fresh convoy deployed.");
    showToast("V2 save reset");
  });

  window.addEventListener("resize", resizeCanvas);

  window.addEventListener("keydown", (event) => {
    if (event.key === " " || event.key.toLowerCase() === "p") {
      togglePause();
      event.preventDefault();
      return;
    }

    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "a", "d", "s", "w"].includes(event.key)) {
      pressedKeys.add(event.key);
      setKeyboardPan();
      event.preventDefault();
    }
  });

  window.addEventListener("keyup", (event) => {
    pressedKeys.delete(event.key);
    setKeyboardPan();
  });
}

function startV2() {
  renderPauseButton();
  applyPatrol(0);
  setupVehicles();
  state.vehicles.forEach(refreshVehiclePose);
  resizeCanvas();
  centerCamera();
  snapCameraToTarget();
  pickNextTarget();
}

function loop(now) {
  const dt = Math.min(0.05, (now - state.lastFrame) / 1000);
  state.lastFrame = now;

  if (!state.paused) {
    state.now = now;
    updateCamera(dt);
    updateVehicles(dt);
    updateParticles(dt);

    if (state.status === "prompting" && now >= state.promptFallbackAt) {
      activateTargetWindow(state.targetVehicleId);
    }

    if (state.status === "active" && now >= state.targetDeadline) {
      handleTimeout();
    }

    advanceTargetCycle();
    updateTimer();
  }

  render();
  window.requestAnimationFrame(loop);
}

async function init() {
  bindCanvas();
  bindControls();
  await loadSave();
  startV2();
  showToast("WordBlaster 2.0 ready");
  window.requestAnimationFrame(loop);
}

init().catch((error) => {
  console.error(error);
  statusCopy("V2 failed to initialize.");
});
