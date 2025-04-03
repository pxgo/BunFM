import type { BotCommand } from "node-telegram-bot-api";

class BotSettings {
  commands: {
    [key: string]: BotCommand;
  } = {
    start: {
      command: "start",
      description: "Display welcome message",
    },
    ls: {
      command: "ls",
      description: "List audio files",
    },
    rm: {
      command: "rm",
      description: "Delete audio by index",
    },
    mute: {
      command: "mute",
      description: "Toggle mute/unmute",
    },
    next: {
      command: "next",
      description: "Skip to next track",
    },
  };
}

export const botSettings = new BotSettings();
