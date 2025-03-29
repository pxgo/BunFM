import type { BotCommand } from "node-telegram-bot-api";

class BotSettings {
  commands: {
    [key: string]: BotCommand;
  } = {
    start: {
      command: "start",
      description: "显示欢迎信息",
    },
    list: {
      command: "list",
      description: "查看已下载文件",
    },
    get: {
      command: "get",
      description: "获取一个音频文件，格式：/get [order]",
    },
    remove: {
      command: "remove",
      description: "删除文件，格式：/remove [order]",
    },
    play: {
      command: "play",
      description: "播放音频，格式：/play [order]",
    },
    stop: {
      command: "stop",
      description: "停止播放音频",
    },
    next: {
      command: "next",
      description: "播放下一个音频",
    },
  };
}

export const botSettings = new BotSettings();
