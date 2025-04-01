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
    this.initMuteCommand();
    this.initNextCommand();
  }

  async sendTextMessage(chatId: number, message: string, messageId?: number) {
    loggerModule.debug(message);
    return await this.bot.sendMessage(
      chatId,
      message,
      messageId === undefined
        ? undefined
        : {
            reply_to_message_id: messageId,
          },
    );
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
        text += `在线收听请访问：${envSettings.getDomain()}\n`;
        text += `服务已稳定运行：${fmModule.getRunningTime()}\n\n`;
        text += `命令列表：\n`;
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
      new RegExp(`^\/${botSettings.commands.ls.command}$`, "i"),
      async (message) => {
        try {
          const medias = await mediaModule.getMediaNames();
          if (medias.length === 0) {
            const text = `共找到 ${medias.length} 个音频文件。`;
            this.sendTextMessageSync(message.chat.id, text, message.message_id);
          } else {
            const perPage = 20;
            for (let i = 0; i < medias.length; i += perPage) {
              let text =
                i === 0 ? `共找到 ${medias.length} 个音频文件: \n\n` : "";
              text += medias
                .slice(i, i + perPage)
                .map((name, index) => `[${i + index + 1}] ${name}`)
                .join("\n");
              await this.sendTextMessage(
                message.chat.id,
                text,
                i === 0 ? message.message_id : undefined,
              );
            }
          }
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
      new RegExp(`^\/${botSettings.commands.rm.command} ([0-9]+)$`, "i"),
      async (message, match) => {
        const chatId = message.chat.id;
        try {
          const mediaInfo = await mediaModule.getMediaByOrderString(
            match ? match[1] : "",
          );
          await fs.promises.unlink(mediaInfo.filePath);

          this.sendTextMessageSync(chatId, `Done`, message.message_id);
        } catch (err) {
          this.sendErrorMessageSync(chatId, err as Error, message.message_id);
        }
      },
    );
  }

  initMuteCommand() {
    this.bot.onText(
      new RegExp(`^\/${botSettings.commands.mute.command}$`, "i"),
      async (message) => {
        const chatId = message.chat.id;
        try {
          const muted = await fmModule.mute();
          this.sendTextMessageSync(
            chatId,
            muted ? "已设置静音" : `已取消静音`,
            message.message_id,
          );
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
          this.sendTextMessageSync(chatId, `Done`, message.message_id);
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
        const r = await this.sendTextMessage(
          chatId,
          `正在下载音频文件，请稍后...`,
          messageId,
        );
        const mediaNames = await mediaModule.getMediaNames();
        if (mediaNames.includes(fileName)) {
          await this.bot.editMessageText(`下载已取消，存在同名文件。`, {
            chat_id: chatId,
            message_id: r.message_id,
          });
          return;
        }
        const tmpFilePath = await this.bot.downloadFile(
          fileId,
          envSettings.tmpDir,
        );
        const mediaFilePath = path.resolve(envSettings.mediaDir, fileName);
        await fs.promises.rename(tmpFilePath, mediaFilePath);

        await this.bot.editMessageText(`文件下载成功。`, {
          chat_id: chatId,
          message_id: r.message_id,
        });
      } catch (err) {
        this.sendErrorMessageSync(chatId, err as Error, message.message_id);
      }
    });
  }
}

export const botModule = new BotModule();
