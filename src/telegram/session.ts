import fs from "node:fs";
import path from "node:path";
import { CONFIG_DIR, ensureDir } from "../utils.js";

export const TELEGRAM_CREDS_DIR = path.join(CONFIG_DIR, "telegram");

const TOKEN_FILE = path.join(TELEGRAM_CREDS_DIR, "token");

export async function saveTelegramToken(token: string): Promise<void> {
  await ensureDir(TELEGRAM_CREDS_DIR);
  await fs.promises.writeFile(TOKEN_FILE, token, "utf-8");
}

export async function loadTelegramToken(): Promise<string | null> {
  try {
    if (fs.existsSync(TOKEN_FILE)) {
      return await fs.promises.readFile(TOKEN_FILE, "utf-8");
    }
  } catch {
    return null;
  }
  return null;
}

export async function telegramTokenExists(): Promise<boolean> {
  return fs.existsSync(TOKEN_FILE);
}

export async function deleteTelegramToken(): Promise<void> {
  if (fs.existsSync(TOKEN_FILE)) {
    await fs.promises.unlink(TOKEN_FILE);
  }
}
