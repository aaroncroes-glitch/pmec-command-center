import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";

const root = join(process.cwd(), "dist");
const output = "/tmp/lumen-vercel-deploy-input.json";

async function collect(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collect(absolute));
    else if (!entry.name.endsWith(".map")) {
      const content = await readFile(absolute);
      const file = relative(root, absolute).split("\\").join("/");
      const isText = /\.(html|js|json|css|txt)$/i.test(file);
      files.push({
        file,
        data: content.toString(isText ? "utf8" : "base64"),
        ...(isText ? {} : { encoding: "base64" }),
      });
    }
  }
  return files;
}

const files = await collect(root);
files.push({ file: "vercel.json", data: JSON.stringify({ rewrites: [{ source: "/(.*)", destination: "/" }] }) });
const request = {
  name: "pmec-control-center-demo-preview",
  target: "preview",
  teamId: "team_fJkYltAFbW5PsfCerv2U4hTn",
  files,
};
await writeFile(output, JSON.stringify(request));
console.log(`Prepared ${files.length} deployable files at ${output}`);
