import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";

const files = [
  "scripts/outputs/app.js",
  "scripts/outputs/supabase-client.js",
  "scripts/outputs/supabase-env.js",
];

const forbiddenPatterns = [
  /service_role/i,
  /sb_secret_/i,
  /database_password/i,
  /postgres:\/\/[^"'\s]+/i,
];

function checkSyntax(file) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, ["--check", file], {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let output = "";
    child.stdout.on("data", (chunk) => {
      output += chunk;
    });
    child.stderr.on("data", (chunk) => {
      output += chunk;
    });
    child.on("close", (code) => {
      resolve({ code, output: output.trim() });
    });
  });
}

for (const file of files) {
  const source = await readFile(file, "utf8");
  const match = forbiddenPatterns.find((pattern) => pattern.test(source));
  if (match) {
    console.error(`${file}: found forbidden frontend secret-like pattern ${match}`);
    process.exitCode = 1;
    continue;
  }

  const result = await checkSyntax(file);
  if (result.code !== 0) {
    console.error(`${file}: ${result.output}`);
    process.exitCode = 1;
  }
}
