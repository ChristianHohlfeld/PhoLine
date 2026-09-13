#!/usr/bin/env node
/**
 * Rebuild extension/pho.js from TypeScript and pack PhoLine.zip at the repo root.
 * Copyright © 2026 Christian Heinrich Hohlfeld
 * ORCID: https://orcid.org/0009-0003-6634-9045
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const entry = join(root, "src", "extension-entry.ts");
const outfile = join(root, "extension", "pho.js");
const zipPath = join(root, "PhoLine.zip");
const extDir = join(root, "extension");

function run(cmd, args) {
  const r = spawnSync(cmd, args, { cwd: root, stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status || 1);
}

const localEsbuild = join(root, "node_modules", "esbuild", "bin", "esbuild");
const esbuildArgs = [
  entry,
  "--bundle",
  "--format=iife",
  "--platform=browser",
  "--target=es2022",
  `--outfile=${outfile}`,
  "--legal-comments=none",
];

if (existsSync(localEsbuild)) run(localEsbuild, esbuildArgs);
else run("npx", ["--yes", "esbuild", ...esbuildArgs]);

const files = [
  "manifest.json",
  "pho.js",
  "hook.js",
  "content.js",
  "popup.html",
  "popup.js",
  "README.txt",
  "icon-16.png",
  "icon-48.png",
  "icon-128.png",
];

const py = `
import os, zipfile
root = ${JSON.stringify(extDir)}
out = ${JSON.stringify(zipPath)}
files = ${JSON.stringify(files)}
with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
    for name in files:
        path = os.path.join(root, name)
        if not os.path.isfile(path):
            raise SystemExit("missing " + name)
        z.write(path, arcname=os.path.join("pholine", name))
print("wrote", out, os.path.getsize(out), "bytes")
`;
run("python3", ["-c", py]);
