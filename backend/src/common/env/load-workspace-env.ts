import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const ENV_FILES = [".env.local", ".env"];
const WORKSPACE_MARKERS = ["package.json", path.join("backend", "prisma", "schema.prisma"), path.join("frontend", "next.config.ts")];

let didLoadWorkspaceEnv = false;

function hasWorkspaceMarkers(directory: string) {
  return WORKSPACE_MARKERS.every((marker) => existsSync(path.join(/* turbopackIgnore: true */ directory, marker)));
}

function findWorkspaceRoot(startDirectory: string) {
  const currentDirectory = path.resolve(startDirectory);
  const parentDirectory = path.dirname(currentDirectory);

  for (const directory of [currentDirectory, parentDirectory]) {
    if (hasWorkspaceMarkers(directory)) {
      return directory;
    }
  }

  return null;
}

function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) {
    return;
  }

  if (typeof process.loadEnvFile === "function") {
    process.loadEnvFile(filePath);
    return;
  }

  const fileContents = readFileSync(filePath, "utf8");

  for (const line of fileContents.split(/\r?\n/u)) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf("=");

    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();

    if (!key || process.env[key] !== undefined) {
      continue;
    }

    let value = trimmedLine.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

export function loadWorkspaceEnv() {
  if (didLoadWorkspaceEnv) {
    return;
  }

  const workspaceRoot = findWorkspaceRoot(process.cwd());
  const envDirectory = workspaceRoot ?? process.cwd();

  for (const file of ENV_FILES) {
    loadEnvFile(path.join(/* turbopackIgnore: true */ envDirectory, file));
  }

  didLoadWorkspaceEnv = true;
}
