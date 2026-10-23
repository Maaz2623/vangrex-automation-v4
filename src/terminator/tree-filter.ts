export function filterTree(tree: string, prompt: string): string {
  const lines = tree.split("\n");

  // Keep elements containing both a role and a name.
  const elements = lines.filter((line) => {
    const separator = line.indexOf("|");

    if (separator === -1) return false;

    const role = line.slice(0, separator).trim();
    const name = line.slice(separator + 1).trim();

    return role.length > 0 && name.length > 0;
  });

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
    .map((line, index) => {
      const separator = line.indexOf("|");
      const role = line.slice(0, separator).trim();
      const name = line.slice(separator + 1).trim();

      const description = `${role} ${name}`.toLowerCase();

      const score = words.reduce(
        (total, word) => total + (description.includes(word) ? 1 : 0),
        0,
      );

      return {
        line: `${role}|${name}`,
        score,
        index,
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index);

  return ranked
    .slice(0, 10)
    .map((item) => item.line)
    .join("\n");
}
