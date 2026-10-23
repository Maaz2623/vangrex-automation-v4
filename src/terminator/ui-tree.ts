import { desktop } from "./desktop";
import * as Terminator from "@mediar-ai/terminator";
import { writeFile } from "node:fs/promises";

const OUTPUT_FILE = "new-tree.txt";
const REFRESH_MS = 1000;

function compactTree(tree: string): string {
  const output: string[] = [];

  for (const raw of tree.split("\n")) {
    const line = raw.trim();
    if (!line) continue;

    const windowMatch = line.match(/^-\s+\[Window\]\s+(.+)$/);
    if (windowMatch) {
      output.push(`WINDOW|${windowMatch[1].split(" - ")[0]}`);
      continue;
    }

    const match = line.match(/#\d+\s+\[([^\]]+)\]\s*(.*)/);
    if (!match) continue;

    const [, role, rest] = match;

    // Extract bounds BEFORE cleaning the rest of the line.
    const boundsMatch = rest.match(/\(bounds:\s*\[([^\]]+)\]/);

    const bounds = boundsMatch ? boundsMatch[1].replace(/\s/g, "") : "";

    const name = rest
      .replace(/\(bounds:\s*\[[^\]]+\]\s*\)/g, "")
      .replace(/\([^)]*\)/g, "")
      .replace(/\b(focused|focusable|disabled|selected|checked)\b/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/[, ]+$/, "");

    output.push(`${role}|${name}|${bounds}`);
  }

  return output.join("\n");
}

export async function getCurrentApplicationTree(): Promise<string> {
  const app = await desktop.getCurrentApplication();

  const { formatted } = desktop.getWindowTreeResult(
    app.processName(),
    undefined,
    {
      propertyMode: Terminator.PropertyLoadingMode.Complete,
      formatOutput: true,
      treeOutputFormat: Terminator.TreeOutputFormat.ClusteredYaml,
    },
  );

  return compactTree(formatted ?? "");
}

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

while (true) {
  const tree = await getCurrentApplicationTree();
  await writeFile(OUTPUT_FILE, tree, "utf8");
  await sleep(REFRESH_MS);
}
