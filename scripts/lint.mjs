import { readFile } from "node:fs/promises";

const files = [
  "outputs/app.js",
  "outputs/supabase-client.js",
];

for (const file of files) {
  const source = await readFile(file, "utf8");
  try {
    new Function(source.replace(/^import[\s\S]*?;\s*/gm, ""));
  } catch (error) {
    console.error(`${file}: ${error.message}`);
    process.exitCode = 1;
  }
}

