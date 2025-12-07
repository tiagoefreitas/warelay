import {
  monitorTelegram,
  sendTelegramMessage,
} from "../providers/telegram/index.js";
import { logWebSelfId, sendMessageWeb } from "../providers/web/index.js";

export type CliDeps = {
  sendMessageWeb: typeof sendMessageWeb;
  sendTelegramMessage: typeof sendTelegramMessage;
  monitorTelegram: typeof monitorTelegram;
};

export function createDefaultDeps(): CliDeps {
  return {
    sendMessageWeb,
    sendTelegramMessage,
    monitorTelegram,
  };
}

export { logWebSelfId };
export { monitorTelegram };
