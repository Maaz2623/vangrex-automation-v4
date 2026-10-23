import "dotenv/config";
import { Bot } from "grammy";
import { generateText, Output } from "ai";
import { google } from "@ai-sdk/google";
import { readFile } from "node:fs/promises";
import { z } from "zod";

import { desktop } from "./terminator/desktop";
import { clickAtBounds } from "./terminator/mouse";
import { filterTree } from "./terminator/tree-filter";

// --------------------------------------------------
// Configuration
// --------------------------------------------------

const MODEL = "gemini-3.5-flash-lite";
const TREE_FILE = "new-tree.txt";
const LOCATOR_TIMEOUT_MS = 2000;

const botToken = process.env.TELEGRAM_BOT_TOKEN;

if (!botToken) {
  throw new Error("Missing TELEGRAM_BOT_TOKEN in .env");
}

const bot = new Bot(botToken);

// Prevent simultaneous commands from the same chat.
const activeChats = new Set<number>();

// --------------------------------------------------
// Output schema
// --------------------------------------------------

const clickSelectionSchema = z.object({
  role: z.string(),
  name: z.string(),
  clickType: z.enum(["left", "right"]),
  double: z.boolean(),
});

// --------------------------------------------------
// Execute one click per user instruction
// --------------------------------------------------

async function executeClick(prompt: string): Promise<string> {
  // Read the current UI tree.
  const tree = await readFile(TREE_FILE, "utf-8");

  // Filter candidates using the user's instruction.
  const candidates = filterTree(tree, prompt);

  if (!candidates.trim()) {
    return "No matching elements found. Try another instruction.";
  }

  console.log("\nMatching candidates:\n", candidates);

  // Ask Gemini to select an element by role and name.
  const { output, usage } = await generateText({
    model: google(MODEL),

    instructions: `
    
Choose the single UI element that best matches the request.

Select only from the supplied candidates.
Return the exact role and name of the selected candidate.
Do not invent or modify either value.

Click rules:
- Use "left" for a normal click.
- Use "right" for a right-click.
- Set double to true only if the user requests a double-click.

Candidates:
${candidates}
    `,

    prompt: `
User request: ${prompt}

`,

    output: Output.object({
      schema: clickSelectionSchema,
    }),
  });

  const { role, name, clickType, double } = output;

  // Validate that the selected role and name exist in the candidates.
  const validCandidate = candidates.split("\n").some((line) => {
    const separator = line.indexOf("|");

    if (separator === -1) return false;

    const candidateRole = line.slice(0, separator).trim();
    const candidateName = line.slice(separator + 1).trim();

    return candidateRole === role && candidateName === name;
  });

  if (!validCandidate) {
    throw new Error(
      `Selected element was not in the candidate list: ${role}|${name}`,
    );
  }

  console.log(`Selected element: ${role}|${name}`);

  // --------------------------------------------------
  // Retrieve actual bounds using Terminator
  // --------------------------------------------------

  const selector = `role:${role}|name:${name}`;

  console.log("Selector:", selector);

  const element = await desktop
    .locator(`role:${role}|name:${name}`)
    .first(LOCATOR_TIMEOUT_MS);
  const bounds = element.bounds();

  console.log(name, bounds);

  if (
    !bounds ||
    !Number.isFinite(bounds.x) ||
    !Number.isFinite(bounds.y) ||
    !Number.isFinite(bounds.width) ||
    !Number.isFinite(bounds.height) ||
    bounds.width <= 0 ||
    bounds.height <= 0
  ) {
    throw new Error(`Could not retrieve valid bounds for ${role}|${name}`);
  }

  console.log(
    `Element bounds: [${bounds.x}, ${bounds.y}, ${bounds.width}, ${bounds.height}]`,
  );

  // --------------------------------------------------
  // Click using the existing mouse implementation
  // --------------------------------------------------

  const clickPosition = await clickAtBounds({
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    clickType,
    double,
  });

  console.log(
    `Clicked at (${clickPosition.x}, ${clickPosition.y}). Tokens used: ${usage.totalTokens}`,
  );

  return (
    `Clicked: ${role}|${name}\n` +
    `Click type: ${clickType}${double ? " (double-click)" : ""}\n` +
    `Position: (${clickPosition.x}, ${clickPosition.y})\n` +
    `Tokens used: ${usage.totalTokens}`
  );
}

// --------------------------------------------------
// /start
// --------------------------------------------------

bot.command("start", async (ctx) => {
  await ctx.reply(
    "Vangrex is online. Send me an instruction to click a UI element.\n\n" +
      "Each message performs one click.\n" +
      "Use /reset to check command readiness.",
  );
});

// --------------------------------------------------
// /reset
// --------------------------------------------------

bot.command("reset", async (ctx) => {
  if (activeChats.has(ctx.chat.id)) {
    await ctx.reply(
      "A click is currently running. Please wait before sending another command.",
    );
    return;
  }

  await ctx.reply("Ready for your next command.");
});

// --------------------------------------------------
// Telegram messages
// --------------------------------------------------

bot.on("message:text", async (ctx) => {
  const chatId = ctx.chat.id;
  const prompt = ctx.message.text.trim();

  if (!prompt || prompt.startsWith("/")) return;

  if (activeChats.has(chatId)) {
    await ctx.reply("I'm still processing your previous command. Please wait.");
    return;
  }

  activeChats.add(chatId);

  try {
    await ctx.api.sendChatAction(chatId, "typing");

    const result = await executeClick(prompt);

    await ctx.reply(result);
  } catch (error) {
    console.error("Click command error:", error);

    await ctx.reply(
      `Command failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  } finally {
    activeChats.delete(chatId);
  }
});

// --------------------------------------------------
// Error handling
// --------------------------------------------------

bot.catch((error) => {
  console.error("Telegram bot error:", error);
});

// --------------------------------------------------
// Start bot
// --------------------------------------------------

bot.start({
  drop_pending_updates: true,
});

console.log("Vangrex Telegram click bot is running...");
