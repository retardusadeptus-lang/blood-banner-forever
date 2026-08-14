import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const sourcePath = path.join(projectRoot, 'src', 'cheat_sheet_extractv2.json');
const outputPath = path.join(projectRoot, 'cheat-sheet-export.json');

try {
  const raw = fs.readFileSync(sourcePath, 'utf8');
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error('Seed file does not contain a JSON array');
  }

  fs.writeFileSync(outputPath, JSON.stringify(parsed, null, 2) + '\n', 'utf8');
  console.log(`Exported cheat-sheet data to ${outputPath}`);
} catch (error) {
  console.error('Failed to export cheat-sheet JSON:', error.message);
  process.exitCode = 1;
}
