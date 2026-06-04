"use strict";

const { spawnSync } = require("child_process");
const { existsSync, readdirSync, statSync } = require("fs");
const { join, relative } = require("path");

const roots = ["server.js", "src"];
const ignoredDirectories = new Set([
  ".git",
  "node_modules",
  "coverage",
  "logs",
  "__tests__",
]);

const files = [];

const collect = (target) => {
  if (!existsSync(target)) return;

  const stats = statSync(target);
  if (stats.isFile()) {
    if (target.endsWith(".js")) files.push(target);
    return;
  }

  for (const entry of readdirSync(target)) {
    const fullPath = join(target, entry);
    if (statSync(fullPath).isDirectory()) {
      if (!ignoredDirectories.has(entry)) collect(fullPath);
      continue;
    }
    if (entry.endsWith(".js")) files.push(fullPath);
  }
};

roots.forEach(collect);

let failed = false;
for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], {
    encoding: "utf8",
  });

  if (result.status !== 0) {
    failed = true;
    console.error(`Syntax check failed: ${relative(process.cwd(), file)}`);
    if (result.stdout) console.error(result.stdout);
    if (result.stderr) console.error(result.stderr);
  }
}

if (failed) process.exit(1);
console.log(`Syntax check passed for ${files.length} JavaScript files.`);
