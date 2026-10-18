import fs from "node:fs/promises";
import path from "node:path";
import { FileGenerator } from "../services/fileGenerator.js";
const publicPath = process.env.PUBLIC_PATH || "/usr/share/nginx/html";
const generator = new FileGenerator(
  publicPath,
  process.env.SRC_PATH || "/app/src",
);
const projects = JSON.parse(
  await fs.readFile(process.env.DATA_PATH || "/app/data/projects.json", "utf8"),
);
await generator.regenerateProjectsFile(projects);
await generator.regenerateImageMetaFile();
console.log(
  "Published responsive metadata; project definitions and originals preserved.",
);
