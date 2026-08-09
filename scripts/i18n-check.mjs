import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const sourceDirs = ["frontend/src", "backend/src"];
const dictionaryFiles = [
  "backend/src/common/i18n/i18n.ts",
  "backend/src/common/i18n/translation-catalogs.ts",
];

function collectFiles(dir) {
  const files = [];
  const stack = [join(root, dir)];

  while (stack.length) {
    const current = stack.pop();
    const entries = readdirSync(current, { withFileTypes: true });

    for (const entry of entries) {
      const path = join(current, entry.name);

      if (entry.isDirectory()) {
        stack.push(path);
        continue;
      }

      if (entry.isFile() && (path.endsWith(".ts") || path.endsWith(".tsx"))) {
        files.push(path);
      }
    }
  }

  return files;
}

function collectTranslationKeys(text) {
  const matches = text.matchAll(/\bt\(\s*(["'])(.*?)\1/gs);
  const keys = new Set();

  for (const [, , rawKey] of matches) {
    if (rawKey.includes("\n") || rawKey.length > 260) {
      continue;
    }

    if (!/[A-Za-zА-Яа-яЇїІіЄєҐґ]/.test(rawKey)) {
      continue;
    }

    keys.add(rawKey);
  }

  return keys;
}

function collectDictionaryKeys(text) {
  const matches = text.matchAll(/^\s*,?\s*"((?:\\.|[^"\\])*)":/gm);
  const keys = new Set();

  for (const [, key] of matches) {
    keys.add(key);
  }

  return keys;
}

const usedKeys = new Set();
for (const dir of sourceDirs) {
  for (const file of collectFiles(dir)) {
    for (const key of collectTranslationKeys(readFileSync(file, "utf8"))) {
      usedKeys.add(key);
    }
  }
}

const dictionaryKeys = new Set();
for (const file of dictionaryFiles) {
  for (const key of collectDictionaryKeys(readFileSync(join(root, file), "utf8"))) {
    dictionaryKeys.add(key);
  }
}

const missingKeys = [...usedKeys].filter((key) => !dictionaryKeys.has(key)).sort();

if (missingKeys.length) {
  console.error("Missing translation keys:");
  for (const key of missingKeys) {
    console.error(`- ${key}`);
  }
  process.exit(1);
}

console.log(`i18n coverage OK: ${usedKeys.size} keys checked`);
