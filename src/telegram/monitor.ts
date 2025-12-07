import type { Message } from "grammy/types";
import { chunkText } from "../auto-reply/chunk.js";
import { getReplyFromConfig } from "../auto-reply/reply.js";
import type { MsgContext } from "../auto-reply/templating.js";
import type { ReplyPayload } from "../auto-reply/types.js";
import { loadConfig } from "../config/config.js";
import { danger, isVerbose, logVerbose, success } from "../globals.js";
import { logDebug, logInfo } from "../logger.js";
import { defaultRuntime, type RuntimeEnv } from "../runtime.js";
import { createTelegramBotAsync } from "./client.js";
import type { TelegramBot } from "./types.js";

const TELEGRAM_TEXT_LIMIT = 4000;

export type TelegramInboundMessage = {
  messageId: number;
  chatId: number;
  text: string;
  from: string;
  to: string;
  firstName?: string;
  username?: string;
  timestamp: number;
};

type MonitorOptions = {
  runtime?: RuntimeEnv;
  verbose?: boolean;
};

export async function monitorTelegram(opts?: MonitorOptions) {
  const runtime = opts?.runtime ?? defaultRuntime;
  const verbose = opts?.verbose ?? false;

  const bot = await createTelegramBotAsync(undefined, runtime);

  logInfo("Monitoring Telegram messages (long polling)...", runtime);

  // Handle text messages
  bot.on("message:text", async (ctx) => {
    try {
      const message = ctx.message;
      const chatId = message.chat.id;
      const from = message.from;
      const text = message.text;

      if (!text || !from) return;

      const inboundMsg: TelegramInboundMessage = {
        messageId: message.message_id,
        chatId,
        text,
        from: String(from.id),
        to: String(chatId),
        firstName: from.first_name,
        username: from.username,
        timestamp: message.date,
      };

      logDebug(
        `[Telegram] ${from.id} (${from.first_name || from.username || "Unknown"}) -> ${chatId}: ${text}`,
      );

      // Handle inbound message with auto-reply
      await handleInboundMessage(bot, inboundMsg, runtime, verbose);
    } catch (err) {
      runtime.error(danger(`Auto-reply failed: ${String(err)}`));
    }
  });

  // Handle media messages with captions
  bot.on("message:photo", async (ctx) => {
    await handleMediaMessage(ctx.message, "photo", bot, runtime, verbose);
  });

  bot.on("message:video", async (ctx) => {
    await handleMediaMessage(ctx.message, "video", bot, runtime, verbose);
  });

  bot.on("message:document", async (ctx) => {
    await handleMediaMessage(ctx.message, "document", bot, runtime, verbose);
  });

  bot.on("message:audio", async (ctx) => {
    await handleMediaMessage(ctx.message, "audio", bot, runtime, verbose);
  });

  bot.on("message:voice", async (ctx) => {
    await handleMediaMessage(ctx.message, "voice", bot, runtime, verbose);
  });

  // Start the bot
  await bot.start({
    onStart: () => {
      logInfo("Telegram bot started successfully", runtime);
    },
  });
}

async function handleMediaMessage(
  message: Message,
  mediaType: string,
  bot: TelegramBot,
  runtime: RuntimeEnv,
  verbose: boolean,
) {
  try {
    const chatId = message.chat.id;
    const from = message.from;
    const caption = "caption" in message ? message.caption : undefined;

    if (!from) return;

    const inboundMsg: TelegramInboundMessage = {
      messageId: message.message_id,
      chatId,
      text: caption || `[${mediaType} message]`,
      from: String(from.id),
      to: String(chatId),
      firstName: from.first_name,
      username: from.username,
      timestamp: message.date,
    };

    logDebug(
      `[Telegram] ${from.id} (${from.first_name || from.username || "Unknown"}) -> ${chatId}: [${mediaType}] ${caption || ""}`,
    );

    await handleInboundMessage(bot, inboundMsg, runtime, verbose);
  } catch (err) {
    runtime.error(danger(`Media message handling failed: ${String(err)}`));
  }
}

async function handleInboundMessage(
  bot: TelegramBot,
  msg: TelegramInboundMessage,
  runtime: RuntimeEnv,
  verbose: boolean,
) {
  const cfg = loadConfig();
  const inboundCfg = cfg.inbound;

  // Check if sender is in allowFrom list
  const allowFrom = inboundCfg?.allowFrom ?? [];
  const senderKey = `telegram:${msg.from}`;

  // For Telegram, we allow all messages by default if no allowFrom is configured
  // or if the sender matches the allowFrom list
  if (allowFrom.length > 0) {
    const isAllowed = allowFrom.some(
      (allowed) =>
        allowed === senderKey ||
        allowed === msg.from ||
        allowed === `telegram:${msg.chatId}`,
    );
    if (!isAllowed) {
      if (verbose) {
        logVerbose(
          `[Telegram] Ignoring message from ${msg.from} (not in allowFrom)`,
        );
      }
      return;
    }
  }

  // Build MsgContext for auto-reply system
  const msgContext: MsgContext = {
    Body: msg.text,
    From: `telegram:${msg.from}`,
    To: `telegram:${msg.to}`,
    MessageSid: `telegram_${msg.messageId}`,
    ChatType: "dm",
  };

  // Get reply from config
  const replyResult = await getReplyFromConfig(msgContext, undefined, cfg);

  if (!replyResult) {
    if (verbose) {
      logVerbose(`[Telegram] No reply generated for message: ${msg.text}`);
    }
    return;
  }

  // Normalize to array
  const replies = Array.isArray(replyResult) ? replyResult : [replyResult];

  // Send the reply
  await sendTelegramReply(bot, msg.chatId, replies, runtime);
}

async function sendTelegramReply(
  bot: TelegramBot,
  chatId: number,
  payloads: ReplyPayload[],
  runtime: RuntimeEnv,
) {
  let sentCount = 0;

  for (const payload of payloads) {
    const body = payload.text;
    if (!body) continue;

    // Chunk long messages
    const chunks = chunkText(body, TELEGRAM_TEXT_LIMIT);

    for (const chunk of chunks) {
      try {
        await bot.api.sendMessage(chatId, chunk);
        sentCount++;
        if (isVerbose()) {
          logVerbose(
            `[Telegram] Sent reply to ${chatId}: ${chunk.slice(0, 100)}...`,
          );
        }
      } catch (err) {
        runtime.error(
          danger(`Failed to send Telegram message: ${String(err)}`),
        );
      }
    }
  }

  if (sentCount > 0) {
    runtime.log(
      success(`Sent ${sentCount} message(s) to Telegram chat ${chatId}`),
    );
  }
}
