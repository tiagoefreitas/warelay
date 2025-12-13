import { Bot } from "grammy";
import type { RuntimeEnv } from "../runtime.js";
import { defaultRuntime } from "../runtime.js";
import { loadTelegramToken } from "./session.js";

let botInstance: Bot | null = null;
let botToken: string | null = null;

export async function createTelegramBotAsync(
  token?: string,
  _runtime: RuntimeEnv = defaultRuntime,
): Promise<Bot> {
  const requestedToken = token || (await loadTelegramToken());
  if (!requestedToken) {
    throw new Error(
      "Telegram bot token not found. Run 'clawdis login --provider telegram' first.",
    );
  }

  // Return existing instance if same token
  if (botInstance && botToken === requestedToken) {
    return botInstance;
  }

  // Create new instance
  botInstance = new Bot(requestedToken);
  botToken = requestedToken;
  return botInstance;
}

export function createTelegramBot(
  token: string,
  _runtime: RuntimeEnv = defaultRuntime,
): Bot {
  if (!token) {
    throw new Error("Telegram bot token is required.");
  }

  // Return existing instance if same token
  if (botInstance && botToken === token) {
    return botInstance;
  }

  // Create new instance
  botInstance = new Bot(token);
  botToken = token;
  return botInstance;
}

export function getTelegramBot(): Bot | null {
  return botInstance;
}

export function closeTelegramBot(): void {
  if (botInstance) {
    botInstance.stop();
    botInstance = null;
  }
}
