#!/usr/bin/env node
// Prints the next sequential Kiro specId (0001, 0002, ...) for a project.
// Usage: node next-spec-id.mjs [projectRoot=.]
// Only purely numeric ids count; legacy ids (e.g. UUIDs) are ignored, never renumbered.
import { readdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";

const root = path.resolve(process.argv[2] ?? ".");
const specsDir = path.join(root, ".kiro", "specs");

let max = 0;
if (existsSync(specsDir)) {
  for (const entry of readdirSync(specsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const cfg = path.join(specsDir, entry.name, ".config.kiro");
    if (!existsSync(cfg)) continue;
    try {
      const id = String(JSON.parse(readFileSync(cfg, "utf8")).specId ?? "");
      if (/^\d+$/.test(id)) max = Math.max(max, Number(id));
    } catch {
      // unreadable config: skip, never fail the run
    }
  }
}

console.log(String(max + 1).padStart(4, "0"));
