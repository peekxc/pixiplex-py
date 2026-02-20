import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const ROOT = process.cwd();
const SRC_JS_DIR = path.join(ROOT, "src", "pixiplex", "javascript");
const DOCS_API_DIR = path.join(ROOT, "docs", "api");
const DOCS_JS_DIR = path.join(DOCS_API_DIR, "js");
const DOCS_OLD_RENDERERS_DIR = path.join(DOCS_API_DIR, "renderers");
const TEMPLATE = path.join(ROOT, "templates", "sig-style.hbs");
const JSDOC2MD_CLI = path.join(ROOT, "node_modules", "jsdoc-to-markdown", "bin", "cli.js");

const walkJsFiles = async (dir) => {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkJsFiles(fullPath)));
    } else if (entry.isFile() && entry.name.endsWith(".js")) {
      files.push(fullPath);
    }
  }
  return files;
};

const renderJsdocMarkdown = async (sourceFile) => {
  const { stdout } = await execFileAsync(
    "node",
    [JSDOC2MD_CLI, "--template", TEMPLATE, "--files", sourceFile],
    { cwd: ROOT, maxBuffer: 10 * 1024 * 1024 },
  );
  return stdout;
};

const main = async () => {
  await fs.rm(DOCS_JS_DIR, { recursive: true, force: true });
  await fs.rm(DOCS_OLD_RENDERERS_DIR, { recursive: true, force: true });
  const sourceFiles = (await walkJsFiles(SRC_JS_DIR)).sort();

  for (const sourceFile of sourceFiles) {
    const relativeToJsRoot = path.relative(SRC_JS_DIR, sourceFile);
    const outputFile = path.join(DOCS_JS_DIR, relativeToJsRoot.replace(/\.js$/, ".md"));
    const markdown = await renderJsdocMarkdown(sourceFile);
    await fs.mkdir(path.dirname(outputFile), { recursive: true });
    await fs.writeFile(outputFile, markdown, "utf8");
  }
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
