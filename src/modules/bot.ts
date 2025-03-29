import TelegramBot from "node-telegram-bot-api";
import path from "path";
import { envSettings } from "../settings/env";
import { mediaModule } from "./media";
import { loggerModule } from "./logger";
import fs from "fs";
import { botSettings } from "../settings/bot";
import { fmModule } from "./fm";

class BotModule {
  bot: TelegramBot;

  constructor() {
    this.bot = new TelegramBot(envSettings.botToken, { polling: true });
    this.bot
      .setMyCommands(Object.values(botSettings.commands))
      .catch(loggerModule.error);
  }

  async init() {
    this.initPollEvent();
    this.initStartCommand();
    this.initListCommand();
    this.initRemoveCommand();
    this.initAudioMessage();
    this.initGetCommand();
    this.initPlayCommand();
    this.initStopCommand();
    this.initNextCommand();
  }

  async sendTextMessage(chatId: number, message: string, messageId?: number) {
    await this.bot.sendMessage(
      chatId,
      message,
      messageId === undefined
        ? undefined
        : {
            reply_to_message_id: messageId,
          },
    );
    loggerModule.debug(message);
  }

  sendTextMessageSync(chatId: number, message: string, messageId?: number) {
    loggerModule.debug(message);
    this.bot
      .sendMessage(
        chatId,
        message,
        messageId === undefined
          ? undefined
          : {
              reply_to_message_id: messageId,
            },
      )
      .catch((err) => {
        loggerModule.error(err);
      });
  }

  sendErrorMessageSync(chatId: number, error: Error, messageId?: number) {
    const errorMessage = `ERROR: ${error.message}`;
    loggerModule.error(error);
    this.sendTextMessageSync(chatId, errorMessage, messageId);
  }

  initPollEvent() {
    this.bot.on("polling_error", (err) => {
      loggerModule.error("Bot on polling error: ", err);
    });
    this.bot.on("poll", () => {
      loggerModule.info("Bot on poll");
    });
  }

  initStartCommand() {
    this.bot.onText(
      new RegExp(`^\/${botSettings.commands.start.command}$`, "i"),
      (message) => {
        let text = `欢迎使用 BunFM! 🎉🎉🎉\n\n`;
        text += `在线收听请访问：https://fm.lockai.net\n\n`;
        text += Object.values(botSettings.commands)
          .map((item) => {
            return `/${item.command} - ${item.description}`;
          })
          .join("\n");
        this.sendTextMessageSync(message.chat.id, text, message.message_id);
      },
    );
  }

  initListCommand() {
    this.bot.onText(
      new RegExp(`^\/${botSettings.commands.list.command}$`, "i"),
      async (message) => {
        try {
          const medias = await mediaModule.getMediaNames();
          let text: string;
          if (medias.length === 0) {
            text = `共找到 ${medias.length} 个文件。`;
          } else {
            text = `共找到 ${medias.length} 个文件: \n\n`;
            text += medias
              .map((name, index) => `${index + 1}. ${name}`)
              .join("\n");
          }

          this.sendTextMessageSync(message.chat.id, text, message.message_id);
        } catch (err) {
          this.sendErrorMessageSync(
            message.chat.id,
            err as Error,
            message.message_id,
          );
        }
      },
    );
  }

  initRemoveCommand() {
    this.bot.onText(
      new RegExp(`^\/${botSettings.commands.remove.command} ([0-9]+)$`, "i"),
      async (message, match) => {
        const chatId = message.chat.id;
        try {
          const mediaInfo = await mediaModule.getMediaByOrderString(
            match ? match[1] : "",
          );
          await fs.promises.unlink(mediaInfo.filePath);

          this.sendTextMessageSync(
            chatId,
            `删除文件成功。\n\n文件：${mediaInfo.filename}`,
            message.message_id,
          );
        } catch (err) {
          this.sendErrorMessageSync(chatId, err as Error, message.message_id);
        }
      },
    );
  }

  initGetCommand() {
    this.bot.onText(
      new RegExp(`^\/${botSettings.commands.get.command} ([0-9]+)$`, "i"),
      async (message, match) => {
        const chatId = message.chat.id;
        try {
          const mediaInfo = await mediaModule.getMediaByOrderString(
            match ? match[1] : "",
          );
          this.sendTextMessageSync(
            chatId,
            `发送中，请稍后...\n\n文件：${mediaInfo.filename}`,
            message.message_id,
          );
          this.bot.sendAudio(chatId, mediaInfo.filePath).catch((err) => {
            this.sendErrorMessageSync(chatId, err, message.message_id);
          });
        } catch (err) {
          this.sendErrorMessageSync(
            message.chat.id,
            err as Error,
            message.message_id,
          );
        }
      },
    );
  }

  initStopCommand() {
    this.bot.onText(
      new RegExp(`^\/${botSettings.commands.stop.command}$`, "i"),
      async (message) => {
        const chatId = message.chat.id;
        try {
          await fmModule.stop();
          this.sendTextMessageSync(chatId, `操作成功`, message.message_id);
        } catch (err) {
          this.sendErrorMessageSync(
            message.chat.id,
            err as Error,
            message.message_id,
          );
        }
      },
    );
  }

  initPlayCommand() {
    this.bot.onText(
      new RegExp(`^\/${botSettings.commands.play.command} ([0-9]+)$`, "i"),
      async (message, match) => {
        const chatId = message.chat.id;
        try {
          await fmModule.play(match ? match[1] : undefined);
          this.sendTextMessageSync(chatId, `操作成功`, message.message_id);
        } catch (err) {
          this.sendErrorMessageSync(
            message.chat.id,
            err as Error,
            message.message_id,
          );
        }
      },
    );
    this.bot.onText(
      new RegExp(`^\/${botSettings.commands.play.command}$`, "i"),
      async (message) => {
        const chatId = message.chat.id;
        try {
          await fmModule.play();
          this.sendTextMessageSync(chatId, `操作成功`, message.message_id);
        } catch (err) {
          this.sendErrorMessageSync(
            message.chat.id,
            err as Error,
            message.message_id,
          );
        }
      },
    );
  }

  initNextCommand() {
    this.bot.onText(
      new RegExp(`^\/${botSettings.commands.next.command}$`, "i"),
      async (message, match) => {
        const chatId = message.chat.id;
        try {
          await fmModule.next();
          this.sendTextMessageSync(chatId, `操作成功`, message.message_id);
        } catch (err) {
          this.sendErrorMessageSync(
            message.chat.id,
            err as Error,
            message.message_id,
          );
        }
      },
    );
  }

  initAudioMessage() {
    this.bot.on("audio", async (message) => {
      const chatId = message.chat.id;
      const audio = message.audio;
      if (!audio) return;
      const fileId = audio.file_id;
      const messageId = message.message_id;
      // @ts-ignore
      const fileName = audio.file_name;
      try {
        await this.sendTextMessage(
          chatId,
          `正在下载文件...\n\n文件：${fileName}`,
          messageId,
        );
        const mediaNames = await mediaModule.getMediaNames();
        if (mediaNames.includes(fileName)) {
          await this.sendTextMessage(
            chatId,
            `下载已取消，存在同名文件。\n\n文件：${fileName}`,
            messageId,
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
          `文件下载成功。\n\n文件：${fileName}`,
          messageId,
        );
      } catch (err) {
        this.sendErrorMessageSync(chatId, err as Error, message.message_id);
      }
    });
  }
}

export const botModule = new BotModule();
