import "dotenv/config";
import { Bot } from "grammy";
import { generateText, Output } from "ai";
import { google } from "@ai-sdk/google";
import { readFile } from "node:fs/promises";
import z from "zod";

import { clickAtBounds } from "./terminator/mouse";
import { filterTree } from "./terminator/tree-filter";

// --------------------------------------------------
// Configuration
// --------------------------------------------------

const MODEL = "gemini-3.5-flash-lite";
const TREE_FILE = "new-tree.txt";

const botToken = process.env.TELEGRAM_BOT_TOKEN;

if (!botToken) {
  throw new Error("Missing TELEGRAM_BOT_TOKEN in .env");
}

const bot = new Bot(botToken);

// Prevent simultaneous commands from the same chat
const activeChats = new Set<number>();

// --------------------------------------------------
// Execute one click per user instruction
// --------------------------------------------------

async function executeClick(prompt: string): Promise<string> {
  const tree = await readFile(TREE_FILE, "utf-8");
  const candidates = filterTree(tree, prompt);

  if (!candidates.trim()) {
    return "No matching elements found. Try another instruction.";
  }

  console.log("\nMatching candidates:\n", candidates);

  const { output, usage } = await generateText({
    model: google(MODEL),

    prompt: `
User request: ${prompt}

Choose the single UI element that best matches the request.
Use only the supplied candidates.
Return its exact bounds.

Bounds format: [x, y, width, height].

Candidates:
${candidates}
`,

    output: Output.object({
      schema: z.object({
        x: z.number(),
        y: z.number(),
        width: z.number(),
        height: z.number(),
      }),
    }),
  });

  console.log(
    `Clicking at bounds: [${output.x}, ${output.y}, ${output.width}, ${output.height}]`,
  );

  // Existing click architecture remains unchanged.
  await clickAtBounds(output);

  console.log(`Click completed. Tokens used: ${usage.totalTokens}`);

  return `Clicked the requested element. Tokens used: ${usage.totalTokens}`;
}

// --------------------------------------------------
// /start
// --------------------------------------------------

bot.command("start", async (ctx) => {
  await ctx.reply(
    "Vangrex is online. Send me an instruction to click a UI element.\n\n" +
      "Each message performs one click.\n" +
      "Use /reset to clear the command state.",
  );
});

// --------------------------------------------------
// /reset
// --------------------------------------------------

bot.command("reset", async (ctx) => {
  if (activeChats.has(ctx.chat.id)) {
    await ctx.reply("A click is currently running. Please wait before sending another command.");
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
