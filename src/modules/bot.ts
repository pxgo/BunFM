import TelegramBot from "node-telegram-bot-api";
import path from "path";
import { envSettings } from "@/settings/env.ts";
import { mediaModule } from "@/modules/media.ts";
import { loggerModule } from "@/modules/logger.ts";
import fs from "fs";

class BotModule {
  bot: TelegramBot;

  constructor() {
    this.bot = new TelegramBot(envSettings.botToken, { polling: true });
  }

  async sendTextMessage(chatId: number, message: string) {
    await this.bot.sendMessage(chatId, message);
    loggerModule.debug(message);
  }

  sendTextMessageSync(chatId: number, message: string) {
    loggerModule.debug(message);
    this.bot.sendMessage(chatId, message).catch((err) => {
      loggerModule.error(err);
    });
  }

  async init() {
    this.bot.on("message", (message) => {
      // console.log("onMessage", message);
    });
    this.bot.onText(/\/help/, async (message) => {
      this.sendTextMessageSync(
        message.chat.id,
        `[/help] Displays help information
[/list] Displays the list of audio files
[/rm <index>] Delete the specified audio file`,
      );
    });
    this.bot.onText(/\/rm ([0-9]+)/, async (message, match) => {
      const chatId = message.chat.id;
      try {
        if (!match) {
          return this.sendTextMessageSync(
            chatId,
            `Error: Please enter a valid index`,
          );
        }
        const index = parseInt(match[1], 10);
        if (isNaN(index)) {
          return this.sendTextMessageSync(
            chatId,
            `Error: Please enter a valid index`,
          );
        }
        const mediasInfo = await mediaModule.getMediasInfo();
        if (index > mediasInfo.length) {
          return this.sendTextMessageSync(
            chatId,
            `Error: Index [${index}] is out of range [${mediasInfo.length}]`,
          );
        }
        const mediaInfo = mediasInfo[index - 1];
        await fs.promises.unlink(mediaInfo.filePath);

        this.sendTextMessageSync(
          chatId,
          `Delete audio [${mediaInfo.filename}] successfully`,
        );
      } catch (err) {
        this.sendTextMessageSync(chatId, `Error: ${err.message}`);
      }
    });
    this.bot.onText(/\/list/, async (message) => {
      try {
        const medias = await mediaModule.getMediaNames();
        await this.sendTextMessage(
          message.chat.id,
          medias.map((name, index) => `${index + 1}. ${name}`).join("\n") ||
            "None",
        );
      } catch (err) {
        this.sendTextMessageSync(message.chat.id, err.message);
      }
    });
    this.bot.on("audio", async (message) => {
      const chatId = message.chat.id;
      const audio = message.audio;
      const fileId = audio.file_id;
      // @ts-ignore
      const fileName = audio.file_name;
      try {
        await this.sendTextMessage(
          chatId,
          `Audio file(${fileName}) received, processing...`,
        );
        const mediaNames = await mediaModule.getMediaNames();
        if (mediaNames.includes(fileName)) {
          await this.sendTextMessage(
            chatId,
            `Audio file(${fileName}) already exists`,
          );
          return;
        }
        const tmpFilePath = await this.bot.downloadFile(
          fileId,
          envSettings.tmpDir,
        );
        const mediaFilePath = path.resolve(envSettings.mediaDir, fileName);
        await fs.promises.rename(tmpFilePath, mediaFilePath);

        await this.sendTextMessage(
          chatId,
          `Audio file(${fileName}) save successfully`,
        );
      } catch (err) {
        this.sendTextMessage(chatId, `Error: ${err.message}`).catch(
          loggerModule.error,
        );
      }
    });
  }
}

export const botModule = new BotModule();

/*
onMessage {
  message_id: 5,
    from: {
    id: 5595179444,
      is_bot: false,
      first_name: "彭于晏",
      language_code: "zh-hans",
  },
  chat: {
    id: 5595179444,
      first_name: "彭于晏",
      type: "private",
  },
  date: 1743170444,
    audio: {
    duration: 263,
      file_name: "忽而今夏(伴奏).mp3",
      mime_type: "audio/mpeg",
      file_id: "CQACAgUAAxkBAAMFZ-arjObkITw2s636kA8Lzh47PPwAAqMUAAJ9QDBXQuee0oOSaeQ2BA",
      file_unique_id: "AgADoxQAAn1AMFc",
      file_size: 4210010,
  },
  caption: "123",
}
onAudio {
  message_id: 5,
    from: {
    id: 5595179444,
      is_bot: false,
      first_name: "彭于晏",
      language_code: "zh-hans",
  },
  chat: {
    id: 5595179444,
      first_name: "彭于晏",
      type: "private",
  },
  date: 1743170444,
    audio: {
    duration: 263,
      file_name: "忽而今夏(伴奏).mp3",
      mime_type: "audio/mpeg",
      file_id: "CQACAgUAAxkBAAMFZ-arjObkITw2s636kA8Lzh47PPwAAqMUAAJ9QDBXQuee0oOSaeQ2BA",
      file_unique_id: "AgADoxQAAn1AMFc",
      file_size: 4210010,
  },
  caption: "123",
}*/
