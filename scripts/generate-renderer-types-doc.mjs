import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();

const ensureDir = async (filePath) => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
};

const main = async () => {
  const sourcePath = path.join(ROOT, "src", "pixiplex", "renderers", "pixiplex_renderer.types.ts");
  const destPath = path.join(ROOT, "docs", "api", "renderers", "types.md");
  const source = await fs.readFile(sourcePath, "utf8");

  const exported = [];
  const typeRegex = /^export\s+type\s+(\w+)/gm;
  const ifaceRegex = /^export\s+interface\s+(\w+)/gm;

  let match;
  while ((match = typeRegex.exec(source)) !== null) {
    exported.push({ kind: "type", name: match[1] });
  }
  while ((match = ifaceRegex.exec(source)) !== null) {
    exported.push({ kind: "interface", name: match[1] });
  }

  exported.sort((a, b) => a.name.localeCompare(b.name));

  const markdown = [
    "# Renderer TypeScript Types",
    "",
    "Generated from `src/pixiplex/renderers/pixiplex_renderer.types.ts`.",
    "",
    "## Exported Symbols",
    "",
    ...exported.map((item) => `- \`${item.kind}\` \`${item.name}\``),
    "",
    "## Source",
    "",
    "```ts",
    source.trimEnd(),
    "```",
    "",
  ].join("\n");

  await ensureDir(destPath);
  await fs.writeFile(destPath, markdown, "utf8");
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
