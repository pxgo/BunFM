import EventEmitter from "eventemitter3";
import { loggerModule } from "@/modules/logger.ts";

interface IEvents {
  muteAudio: (chunk: Uint8Array) => void;
}

class AudioModule extends EventEmitter<IEvents> {
  muteAudioTask: Bun.Subprocess<"ignore", "pipe", "inherit"> = null;
  constructor() {
    super();
  }

  async init() {
    this.initMuteAudioCreator().catch((err) => {
      loggerModule.errorExit(err);
    });
  }

  async initMuteAudioCreator() {
    this.muteAudioTask = Bun.spawn(
      [
        "ffmpeg",
        "-v",
        "quiet",
        "-re",
        "-f",
        "lavfi",
        "-i",
        "anullsrc=r=44100:cl=stereo",
        "-tune",
        "zerolatency",
        "-f",
        "mp3",
        "-c:a",
        "mp3", // 音频编码为 MP3
        "pipe:1",
      ],
      {
        stdio: ["ignore", "pipe", "inherit"],
      },
    );

    const reader = this.muteAudioTask.stdout.getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (value) {
        this.emit("muteAudio", value);
      }
      if (done) break;
    }
  }

  async readAudioFile(filePath: string, callback: (chunk: Uint8Array) => void) {
    const task = Bun.spawn(
      [
        "ffmpeg",
        "-v",
        "quiet",
        "-re",
        "-i",
        filePath,
        "-ar",
        "44100",
        "-ac",
        "2",
        "-f",
        "mp3",
        "-c:a",
        "mp3",
        "pipe:1",
      ],
      {
        stdio: ["ignore", "pipe", "inherit"],
      },
    );

    const reader = task.stdout.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (value) {
        callback(value);
      }
      if (done) break;
    }
    await task.exited;
  }
}

export const audioModule = new AudioModule();
