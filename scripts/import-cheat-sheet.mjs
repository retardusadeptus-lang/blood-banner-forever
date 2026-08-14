import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const inputPath = path.join(projectRoot, 'cheat-sheet-export.json');
const targetPath = path.join(projectRoot, 'src', 'cheat_sheet_extractv2.json');

try {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Missing import file at ${inputPath}`);
  }

  const raw = fs.readFileSync(inputPath, 'utf8');
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error('Import file does not contain a JSON array');
  }

  fs.writeFileSync(targetPath, JSON.stringify(parsed, null, 2) + '\n', 'utf8');
  console.log(`Imported cheat-sheet data into ${targetPath}`);
} catch (error) {
  console.error('Failed to import cheat-sheet JSON:', error.message);
  process.exitCode = 1;
}
