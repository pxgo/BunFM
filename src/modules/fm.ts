import { envSettings } from "../settings/env";
import { mediaModule } from "./media";
import { EventEmitter } from "eventemitter3";
import { loggerModule } from "./logger";
import { timeModule } from "./time";
import { audioModule } from "./audio";
import { ChildProcess } from "child_process";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import fs from "fs";
dayjs.extend(duration);

interface IEvents {
  fmData: (chunk: Buffer) => void;
}

class FMModule extends EventEmitter<IEvents> {
  startupTime = Date.now();
  currentMediaIndex: number = -1;
  muted: boolean = false;
  readerTask: ChildProcess | null = null;
  from: "file" | "muteAudio" = "muteAudio";
  audioBufferCache: Buffer = Buffer.allocUnsafe(envSettings.bufferSize);
  constructor() {
    super();
    audioModule.on("muteAudio", (chunk) => {
      this.emitFMData("muteAudio", chunk);
    });

    this.on("fmData", (chunk) => {
      const chunkLen = chunk.length;
      const cacheLen = this.audioBufferCache.length;
      if (chunkLen < cacheLen) {
        this.audioBufferCache.copyWithin(0, chunkLen);
        chunk.copy(this.audioBufferCache, cacheLen - chunkLen);
      } else {
        chunk.copy(this.audioBufferCache, 0, chunkLen - cacheLen, chunkLen);
      }
    });
  }

  getRunningTime() {
    const now = Date.now();
    const diffMs = now - this.startupTime;
    const duration = dayjs.duration(diffMs);
    const years = duration.years();
    const days = duration.days();
    const hours = duration.hours();
    const minutes = duration.minutes();
    const seconds = duration.seconds();

    const textArr = [];
    if (years > 0) {
      textArr.push(`${years}y`);
    }
    if (days > 0) {
      textArr.push(`${days}d`);
    }
    if (hours > 0) {
      textArr.push(`${hours}h`);
    }
    if (minutes > 0) {
      textArr.push(`${minutes}m`);
    }
    if (seconds > 0) {
      textArr.push(`${seconds}s`);
    }

    return textArr.join(" ");
  }

  private emitFMData(from: "file" | "muteAudio", chunk: Buffer) {
    if (this.muted) {
      if (from === "muteAudio") {
        return this.emit("fmData", chunk);
      }
    } else if (from === this.from) {
      return this.emit("fmData", chunk);
    }
  }

  async init() {
    while (true) {
      this.from = "muteAudio";

      try {
        const mediaInfo = await this.getNextMediaInfo();
        if (mediaInfo === null) {
          await timeModule.sleep(2000);
          continue;
        }
        await audioModule.readAudioFile(
          mediaInfo.filePath,
          (task) => {
            this.readerTask = task;
          },
          (buffer) => {
            this.from = "file";
            this.emitFMData("file", buffer);
          },
        );

        if (envSettings.autoRemove) {
          await fs.promises.unlink(mediaInfo.filePath);
        }
      } catch (err) {
        this.from = "muteAudio";
        loggerModule.error(err);
        await timeModule.sleep(2000);
      }
    }
  }

  resetMediaIndex(mediaCount: number) {
    let nextMediaIndex: number;
    if (envSettings.randomOrder) {
      nextMediaIndex = Math.floor(Math.random() * mediaCount);
    } else {
      if (this.currentMediaIndex + 1 >= mediaCount) {
        nextMediaIndex = 0;
      } else {
        nextMediaIndex = this.currentMediaIndex + 1;
      }
    }
    this.currentMediaIndex = nextMediaIndex;
  }

  async getNextMediaInfo() {
    const medias = await mediaModule.getMediasInfo();
    this.resetMediaIndex(medias.length);
    return medias[this.currentMediaIndex] || null;
  }

  async next() {
    this.from = "muteAudio";
    this.killReaderTask();
  }

  async mute() {
    this.muted = !this.muted;
    return this.muted;
  }

  killReaderTask() {
    const task = this.readerTask;
    if (task && !task.killed) {
      task.kill("SIGKILL");
    }
  }
}

export const fmModule = new FMModule();
