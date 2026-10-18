import fs from 'node:fs/promises';
import path from 'node:path';
import { randomInt } from 'node:crypto';
import { FileGenerator } from '../services/fileGenerator.js';
import { PROJECT_CATEGORIES, isProjectCategory } from '../services/projectCategories.js';

const dataPath = process.env.DATA_PATH || '/app/data/projects.json';
const publicPath = process.env.PUBLIC_PATH || '/usr/share/nginx/html';
const generator = new FileGenerator(publicPath, process.env.SRC_PATH || '/app/src');
const original = await fs.readFile(dataPath, 'utf8');
const projects = JSON.parse(original);
const pending = projects.filter(project => !isProjectCategory(project.category));
if (pending.length) {
  const backupPath = `${dataPath}.before-categories-${Date.now()}.bak`;
  await fs.writeFile(backupPath, original, { flag: 'wx' });
  const categories = [...PROJECT_CATEGORIES];
  for (let i = categories.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [categories[i], categories[j]] = [categories[j], categories[i]];
  }
  // Shuffle a balanced distribution so the temporary projects exercise every filter.
  const assignments = pending.map((_, i) => categories[i % categories.length]);
  for (let i = assignments.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [assignments[i], assignments[j]] = [assignments[j], assignments[i]];
  }
  pending.forEach((project, i) => { project.category = assignments[i]; });
  await generator.saveProjectsData(dataPath, projects);
  console.log(`Backup: ${backupPath}; assigned ${pending.length} temporary categories.`);
}
await generator.regenerateProjectsFile(projects);
console.log(JSON.stringify(projects.map(({ slug, category }) => ({ slug, category }))));
