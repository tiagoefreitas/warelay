import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendTelegramMessage } from "./send.js";

// Mock the client module
vi.mock("./client.js", () => ({
  createTelegramBotAsync: vi.fn(),
}));

describe("telegram send", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends text message successfully", async () => {
    const { createTelegramBotAsync } = await import("./client.js");
    const mockBot = {
      api: {
        sendMessage: vi.fn().mockResolvedValue({
          message_id: 123,
          chat: { id: 456 },
        }),
      },
    };
    vi.mocked(createTelegramBotAsync).mockResolvedValue(mockBot as never);

    const result = await sendTelegramMessage(456, "Hello Telegram");

    expect(result).toEqual({ messageId: 123, chatId: 456 });
    expect(mockBot.api.sendMessage).toHaveBeenCalledWith(456, "Hello Telegram");
  });

  it("sends photo message with caption", async () => {
    const { createTelegramBotAsync } = await import("./client.js");
    const mockBot = {
      api: {
        sendPhoto: vi.fn().mockResolvedValue({
          message_id: 789,
          chat: { id: 456 },
        }),
      },
    };
    vi.mocked(createTelegramBotAsync).mockResolvedValue(mockBot as never);

    const result = await sendTelegramMessage(456, "Check this out", {
      mediaUrl: "https://example.com/image.jpg",
    });

    expect(result).toEqual({ messageId: 789, chatId: 456 });
    expect(mockBot.api.sendPhoto).toHaveBeenCalledWith(
      456,
      "https://example.com/image.jpg",
      { caption: "Check this out" },
    );
  });

  it("detects video media type", async () => {
    const { createTelegramBotAsync } = await import("./client.js");
    const mockBot = {
      api: {
        sendVideo: vi.fn().mockResolvedValue({
          message_id: 999,
          chat: { id: 456 },
        }),
      },
    };
    vi.mocked(createTelegramBotAsync).mockResolvedValue(mockBot as never);

    const result = await sendTelegramMessage(456, "Video message", {
      mediaUrl: "https://example.com/video.mp4",
    });

    expect(result).toEqual({ messageId: 999, chatId: 456 });
    expect(mockBot.api.sendVideo).toHaveBeenCalledWith(
      456,
      "https://example.com/video.mp4",
      { caption: "Video message" },
    );
  });
});
