import type { RuntimeEnv } from "../runtime.js";

export function formatTelegramError(err: unknown): string {
  if (err instanceof Error) {
    return err.message;
  }
  if (typeof err === "object" && err !== null) {
    const errObj = err as Record<string, unknown>;
    if (errObj.error_code) {
      return `Error ${errObj.error_code}: ${errObj.description || "Unknown error"}`;
    }
    if (errObj.description) {
      return String(errObj.description);
    }
  }
  return String(err);
}

export function logTelegramError(
  err: unknown,
  chatId: string | number,
  runtime: RuntimeEnv,
): void {
  const errorMsg = formatTelegramError(err);
  runtime.error(`❌ Telegram error (chat ${chatId}): ${errorMsg}`);
}

export function formatChatId(chatId: number | string): string {
  return String(chatId);
}

export function parseChatId(input: string): number | string {
  // Try to parse as number first (Telegram user/group IDs are numbers)
  const asNumber = Number.parseInt(input, 10);
  if (!Number.isNaN(asNumber)) {
    return asNumber;
  }
  // Return as string for usernames like @channel
  return input;
}
