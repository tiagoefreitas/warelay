import type { Bot, Context } from "grammy";

export type TelegramBot = Bot;
export type TelegramContext = Context;

export type TelegramMessage = {
  messageId: number;
  chatId: number;
  text?: string;
  from?: {
    id: number;
    firstName?: string;
    lastName?: string;
    username?: string;
  };
  date: number;
};

export type TelegramSendOptions = {
  chatId: number | string;
  text: string;
  mediaUrl?: string;
  mediaType?: "photo" | "video" | "document" | "audio";
};
