#!/usr/bin/env node
/**
 * Check relative Markdown links, workspace index coverage, and that
 * backticked pnpm commands in the index are existing scripts.
 * External URLs are skipped so the check does not depend on the network.
 */
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const indexFiles = ["docs/README.md", "README.md"];
const errors = [];

async function walk(dir, acc = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === ".git" || entry.name === "dist" || entry.name === ".next") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full, acc);
    else if (entry.isFile() && entry.name.endsWith(".md")) acc.push(full);
  }
  return acc;
}

function stripFences(text) {
  return text.replace(/```[\s\S]*?```/g, "");
}

function* markdownLinks(text) {
  const re = /\[(?:[^\]\\]|\\.)*\]\((<[^>]+>|[^)\s]+)(?:\s+"[^"]*")?\)/g;
  for (const match of text.matchAll(re)) {
    let href = match[1];
    if (href.startsWith("<") && href.endsWith(">")) href = href.slice(1, -1);
    yield href;
  }
}

async function workspaceDirs(parent) {
  const entries = await readdir(path.join(root, parent), { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => `${parent}/${entry.name}`)
    .sort();
}

function packageName(pkg) {
  return pkg.name;
}

async function loadPackage(dir) {
  const file = path.join(root, dir, "package.json");
  return JSON.parse(await readFile(file, "utf8"));
}

function validatePnpm(command, packagesByName, rootScripts) {
  const parts = command.split("&&").map((part) => part.trim()).filter(Boolean);
  for (const part of parts) {
    const tokens = part.split(/\s+/);
    if (tokens[0] !== "pnpm") {
      errors.push(`Not a pnpm command: ${part}`);
      continue;
    }
    if (tokens[1] === "--filter" || tokens[1] === "-F") {
      const name = tokens[2];
      const script = tokens[3];
      const pkg = packagesByName.get(name);
      if (!pkg) {
        errors.push(`Unknown workspace package in command: ${part}`);
        continue;
      }
      if (!script || !pkg.scripts?.[script]) {
        errors.push(`Unknown package script in command: ${part}`);
      }
      if (tokens.length > 4) errors.push(`Unexpected extra arguments in command: ${part}`);
      continue;
    }
    const script = tokens[1];
    if (!script || !Object.prototype.hasOwnProperty.call(rootScripts, script)) {
      errors.push(`Unknown root script in command: ${part}`);
      continue;
    }
    if (tokens.length > 2) errors.push(`Unexpected extra arguments in command: ${part}`);
  }
}

function tableRows(text) {
  return text.split("\n").filter((line) => line.startsWith("|") && !line.startsWith("| ---") && !line.includes("| Path |") && !line.includes("| Document |"));
}

const rootPkg = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
const dirs = [...(await workspaceDirs("apps")), ...(await workspaceDirs("packages"))];
const packages = [];
for (const dir of dirs) packages.push({ dir, pkg: await loadPackage(dir) });
const packagesByName = new Map(packages.map(({ pkg }) => [packageName(pkg), pkg]));

for (const rel of indexFiles) {
  const text = await readFile(path.join(root, rel), "utf8");
  const rows = tableRows(text);
  for (const { dir, pkg } of packages) {
    if (!text.includes(`${dir}`)) errors.push(`${rel} does not mention ${dir}`);
    if (pkg.description && !text.includes(pkg.description)) {
      errors.push(`${rel} is missing the package.json description for ${dir}`);
    }
    const row = rows.find((line) => line.includes(dir));
    if (!row) {
      errors.push(`${rel} has no index row for ${dir}`);
      continue;
    }
    const commands = [...row.matchAll(/`([^`\n]+)`/g)].map((match) => match[1]).filter((cmd) => cmd.startsWith("pnpm"));
    if (commands.length === 0) errors.push(`${rel} row for ${dir} has no pnpm run command`);
    for (const command of commands) validatePnpm(command, packagesByName, rootPkg.scripts);
  }
  for (const match of stripFences(text).matchAll(/`([^`\n]+)`/g)) {
    const command = match[1].trim();
    if (!command.startsWith("pnpm")) continue;
    validatePnpm(command, packagesByName, rootPkg.scripts);
  }
}

const files = await walk(root);
for (const file of files) {
  const text = stripFences(await readFile(file, "utf8"));
  for (const href of markdownLinks(text)) {
    if (/^(https?:|mailto:|tel:)/i.test(href)) continue;
    if (href.startsWith("#")) continue;
    const hash = href.indexOf("#");
    const pathname = hash === -1 ? href : href.slice(0, hash);
    const anchor = hash === -1 ? "" : href.slice(hash + 1);
    if (!pathname) continue;
    if (pathname.startsWith("/")) {
      errors.push(`${path.relative(root, file)}: site path is not a file link: ${href}`);
      continue;
    }
    const target = path.resolve(path.dirname(file), decodeURIComponent(pathname));
    const relative = path.relative(root, target);
    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      errors.push(`${path.relative(root, file)}: link escapes the repo: ${href}`);
      continue;
    }
    try {
      const info = await stat(target);
      if (anchor && info.isFile() && target.endsWith(".md")) {
        const body = await readFile(target, "utf8");
        const slugs = new Set();
        for (const line of body.split("\n")) {
          const heading = /^(#{1,6})\s+(.+)$/.exec(line.trim());
          if (!heading) continue;
          const slug = heading[2]
            .trim()
            .toLowerCase()
            .replace(/[`*_]/g, "")
            .replace(/[^\w\s-]/g, "")
            .replace(/\s+/g, "-");
          slugs.add(slug);
        }
        if (!slugs.has(anchor.toLowerCase())) {
          errors.push(`${path.relative(root, file)}: missing anchor #${anchor} in ${pathname}`);
        }
      }
    } catch {
      errors.push(`${path.relative(root, file)}: dead link ${href}`);
    }
  }
}

if (errors.length) {
  console.error("Link check failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Link check passed (${files.length} Markdown files, ${dirs.length} workspace paths).`);
