// Hands the entry in: copies this repository's game/ and screenshots/ beside main.ts into the output
// directory the grader mounts (MAKEFUN_OUTPUT_DIR stands in for /output outside it), then writes
// dossier.json with the vendored make.fun library. The game is plain static files - one HTML page and
// its ES modules, no library and no network request - so the browser opens game/index.html offline.
//
// Each run starts from empty game/ and screenshots/ targets, so two runs of the same commit write the
// same bytes and no file from an earlier run leaks into the judged output.
//
//   node serve.ts                                  # play locally at http://127.0.0.1:8080
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });

const gameOut = join(out, 'game');
const shotsOut = join(out, 'screenshots');
rmSync(gameOut, { recursive: true, force: true });
rmSync(shotsOut, { recursive: true, force: true });

cpSync(join(here, 'game'), gameOut, { recursive: true });
mkdirSync(shotsOut, { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), shotsOut, { recursive: true });
}

// These are the scorer's own caps (reference/gate.json). Only text_max_bytes shapes the dossier text;
// the rest make this program refuse the same entries the scorer would: over 4 screenshots, one over
// 256 KiB, over 993 entries or 48 MiB under game/, or a game path over 1,000 UTF-8 bytes.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
