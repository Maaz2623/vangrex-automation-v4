export function filterTree(tree: string, prompt: string): string {
  const lines = tree.split("\n");

  // Keep only elements with bounds.
  const elements = lines.filter((line) =>
    /#\d+ \[[^\]]+\].*\(bounds: \[[\d,\s]+\]/.test(line),
  );

  // Extract meaningful words from the user's request.
  const stopWords = new Set([
    "click",
    "on",
    "the",
    "a",
    "an",
    "please",
    "button",
    "icon",
    "element",
    "open",
    "select",
  ]);

  const words = prompt
    .toLowerCase()
    .replace(/[^a-z0-9+#\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 1 && !stopWords.has(word));

  // Rank elements by matching words against their descriptions.
  const ranked = elements
    .map((line) => {
      const description = line
        .replace(/^\s*#\d+\s*/, "")
        .replace(/\(bounds:.*$/, "")
        .toLowerCase();

      const score = words.reduce(
        (total, word) => total + (description.includes(word) ? 1 : 0),
        0,
      );

      return { line: line.trim(), score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return ranked
    .slice(0, 10)
    .map((item) => item.line)
    .join("\n");
}
