import fs from "node:fs";
import { InputFile } from "grammy";
import { logInfo } from "../logger.js";
import { defaultRuntime, type RuntimeEnv } from "../runtime.js";
import { createTelegramBotAsync } from "./client.js";
import { formatTelegramError } from "./utils.js";

export async function sendTelegramMessage(
  chatId: string | number,
  text: string,
  opts?: { mediaUrl?: string },
  runtime: RuntimeEnv = defaultRuntime,
): Promise<{ messageId: number; chatId: number }> {
  const bot = await createTelegramBotAsync(undefined, runtime);

  try {
    // Send with media if provided
    if (opts?.mediaUrl) {
      const mediaType = detectMediaType(opts.mediaUrl);
      const file = await prepareMediaFile(opts.mediaUrl);

      let sentMessage: { message_id: number; chat: { id: number } };
      switch (mediaType) {
        case "photo":
          sentMessage = await bot.api.sendPhoto(chatId, file, {
            caption: text || undefined,
          });
          break;
        case "video":
          sentMessage = await bot.api.sendVideo(chatId, file, {
            caption: text || undefined,
          });
          break;
        case "audio":
          sentMessage = await bot.api.sendAudio(chatId, file, {
            caption: text || undefined,
          });
          break;
        default:
          sentMessage = await bot.api.sendDocument(chatId, file, {
            caption: text || undefined,
          });
      }

      logInfo(
        `✅ Telegram message sent (with media). Message ID: ${sentMessage.message_id} -> chat ${chatId}`,
        runtime,
      );
      return { messageId: sentMessage.message_id, chatId: sentMessage.chat.id };
    }

    // Send text-only message
    const sentMessage = await bot.api.sendMessage(chatId, text);
    logInfo(
      `✅ Telegram message sent. Message ID: ${sentMessage.message_id} -> chat ${chatId}`,
      runtime,
    );
    return { messageId: sentMessage.message_id, chatId: sentMessage.chat.id };
  } catch (err) {
    const errorMsg = formatTelegramError(err);
    runtime.error(`❌ Telegram send failed: ${errorMsg}`);
    throw err;
  }
}

function detectMediaType(
  url: string,
): "photo" | "video" | "audio" | "document" {
  const lower = url.toLowerCase();
  if (
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".png") ||
    lower.endsWith(".gif") ||
    lower.endsWith(".webp")
  ) {
    return "photo";
  }
  if (
    lower.endsWith(".mp4") ||
    lower.endsWith(".mov") ||
    lower.endsWith(".avi") ||
    lower.endsWith(".mkv")
  ) {
    return "video";
  }
  if (
    lower.endsWith(".mp3") ||
    lower.endsWith(".ogg") ||
    lower.endsWith(".m4a") ||
    lower.endsWith(".wav")
  ) {
    return "audio";
  }
  return "document";
}

async function prepareMediaFile(url: string): Promise<InputFile | string> {
  // If it's a URL, return it directly (Telegram can fetch it)
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  // If it's a local file, read it and return as InputFile
  if (fs.existsSync(url)) {
    return new InputFile(url);
  }

  throw new Error(`Media file not found: ${url}`);
}
