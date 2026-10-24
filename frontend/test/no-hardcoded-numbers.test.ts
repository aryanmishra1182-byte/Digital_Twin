import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

function getFilesRecursively(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getFilesRecursively(fullPath, fileList);
    } else if (/\.(ts|tsx)$/.test(file)) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

describe('Integrity check: Zero hardcoded metrics or fake randomness in src/', () => {
  it('ensures no file in src/ contains forbidden metric literals or Math.random', () => {
    const srcDir = path.resolve(__dirname, '../src');
    const files = getFilesRecursively(srcDir);
    const forbiddenLiterals = ['94.55', '98.45', '0.22 hrs', 'Math.random'];

    const violations: { file: string; literal: string }[] = [];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      for (const literal of forbiddenLiterals) {
        if (content.includes(literal)) {
          violations.push({ file: path.relative(srcDir, file), literal });
        }
      }
    }

    expect(
      violations,
      `Found forbidden hardcoded literals or random generator in src/: ${JSON.stringify(violations)}`
    ).toHaveLength(0);
  });
});
