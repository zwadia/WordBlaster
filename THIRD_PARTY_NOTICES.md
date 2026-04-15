# Third-Party Notices

This project is licensed under the MIT License. Third-party components used by
the project remain under their own licenses.

## JavaScript Dependencies

### kokoro-js

- Package: `kokoro-js`
- Upstream: https://github.com/hexgrad/kokoro
- License: Apache-2.0
- Usage in this project: local text-to-speech generation in `server.js`

### @huggingface/transformers

- Package: `@huggingface/transformers`
- Upstream: https://github.com/huggingface/transformers.js
- License: Apache-2.0
- Usage in this project: transitive dependency used by `kokoro-js`

### phonemizer

- Package: `phonemizer`
- Upstream: https://github.com/xenova/phonemizer.js
- License: Apache-2.0
- Usage in this project: transitive dependency used by `kokoro-js`

## Models

### Kokoro ONNX model

- Model: `onnx-community/Kokoro-82M-v1.0-ONNX`
- Upstream: https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX
- License: Apache-2.0
- Usage in this project: runtime model loaded by `kokoro-js` for local text-to-speech

## Notes

- The MIT License in this repository applies to the original WordBlaster code
  and repository-owned assets unless a file states otherwise.
- Third-party packages and models are not relicensed by this repository.
- If you redistribute third-party components directly, you are responsible for
  complying with their license terms, including any Apache-2.0 notice
  requirements where applicable.
