import type { BotCommand } from "node-telegram-bot-api";

class BotSettings {
  commands: {
    [key: string]: BotCommand;
  } = {
    start: {
      command: "start",
      description: "显示欢迎信息",
    },
    ls: {
      command: "ls",
      description: "查看列表",
    },
    rm: {
      command: "rm",
      description: "删除指定序号的音频",
    },
    mute: {
      command: "mute",
      description: "静音/取消静音",
    },
    next: {
      command: "next",
      description: "下一曲",
    },
  };
}

export const botSettings = new BotSettings();
