import { desktop } from "./desktop";
import * as Terminator from "@mediar-ai/terminator";
import { writeFile } from "node:fs/promises";

export const getCurrentApplicationTree = async () => {
  const currentApplication = await desktop.getCurrentApplication();

  const { formatted } = desktop.getWindowTreeResult(
    currentApplication.processName(),
    undefined,
    {
      propertyMode: Terminator.PropertyLoadingMode.Complete,
      formatOutput: true,
      treeOutputFormat: Terminator.TreeOutputFormat.CompactYaml,
    },
  );

  await writeFile("new-tree.txt", formatted as string, "utf-8");

  if (!formatted) {
    return {
      tree: "No tree format.",
    };
  }

  return {
    tree: formatted,
  };
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

while (true) {
  await getCurrentApplicationTree();
  await sleep(1000);
}
