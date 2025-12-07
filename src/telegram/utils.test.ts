import { describe, expect, it } from "vitest";
import { formatTelegramError, parseChatId } from "./utils.js";

describe("telegram utils", () => {
  describe("formatTelegramError", () => {
    it("formats Error objects", () => {
      const error = new Error("Connection failed");
      expect(formatTelegramError(error)).toBe("Connection failed");
    });

    it("formats objects with description", () => {
      const error = { description: "Invalid bot token" };
      expect(formatTelegramError(error)).toBe("Invalid bot token");
    });

    it("formats objects with error_code", () => {
      const error = { error_code: 400, description: "Bad Request" };
      expect(formatTelegramError(error)).toBe("Error 400: Bad Request");
    });

    it("converts unknown errors to string", () => {
      expect(formatTelegramError("simple string")).toBe("simple string");
      expect(formatTelegramError(42)).toBe("42");
    });
  });

  describe("parseChatId", () => {
    it("parses numeric chat IDs", () => {
      expect(parseChatId("123456")).toBe(123456);
      expect(parseChatId("-987654321")).toBe(-987654321);
    });

    it("returns string for usernames", () => {
      expect(parseChatId("@channel_name")).toBe("@channel_name");
      expect(parseChatId("not_a_number")).toBe("not_a_number");
    });
  });
});
