export function filterTree(tree: string, prompt: string): string {
  const lines = tree.split("\n");

  // Keep only elements with role, name, and valid bounds.
  const elements = lines.filter((line) =>
    /^[^|\n]+\|[^|\n]*\|[\d,\s]+$/.test(line.trim()),
  );

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
    "to",
    "in",
    "and",
    "for",
    "with",
    "from",
    "app",
    "application",
    "using",
    "then",
  ]);

  const words = prompt
    .toLowerCase()
    .replace(/[^a-z0-9+#\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 1 && !stopWords.has(word));

  const ranked = elements
    .map((line) => {
      const [role, name, bounds] = line.trim().split("|");
      const description = `${role} ${name}`.toLowerCase();

      const score = words.reduce(
        (total, word) => total + (description.includes(word) ? 1 : 0),
        0,
      );

      return {
        line: `${role}|${name}|${bounds}`,
        score,
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return ranked
    .slice(0, 10)
    .map((item) => item.line)
    .join("\n");
}
