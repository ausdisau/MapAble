import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = join(process.cwd(), "packages");
const forbidden = [
  /@\/app\//,
  /@\/lib\/prisma/,
  /@prisma\/client/,
  /stripe/,
  /next\//,
  /@openai\//,
];

function files(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? files(path) : entry.name.endsWith(".ts") ? [path] : [];
  });
}

const violations = files(root).flatMap((path) => {
  const source = readFileSync(path, "utf8");
  return forbidden
    .filter((pattern) => pattern.test(source))
    .map((pattern) => `${path}: prohibited dependency ${pattern}`);
});

if (violations.length > 0) {
  console.error(violations.join("\n"));
  process.exit(1);
}

console.log("Package boundary check passed.");
