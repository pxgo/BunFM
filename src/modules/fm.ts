import { envSettings } from "../settings/env";
import { mediaModule } from "./media";
import { EventEmitter } from "eventemitter3";
import { loggerModule } from "./logger";
import { timeModule } from "./time";
import { audioModule } from "./audio";
import { ChildProcess } from "child_process";

interface IEvents {
  fmData: (chunk: Buffer) => void;
}

class FMModule extends EventEmitter<IEvents> {
  currentMediaIndex: number = -1;
  specifiedMediaIndex: number | null = null;

  readerTask: ChildProcess | null = null;

  from: "file" | "muteAudio" = "muteAudio";

  stopped: boolean = false;

  constructor() {
    super();
    audioModule.on("muteAudio", (chunk) => {
      this.emitFMData("muteAudio", chunk);
    });
  }

  private emitFMData(from: "file" | "muteAudio", chunk: Buffer) {
    if (from === this.from) {
      this.emit("fmData", chunk);
    }
  }

  async init() {
    while (true) {
      this.from = "muteAudio";

      // 暂停
      if (this.stopped) {
        await timeModule.sleep(2000);
        continue;
      }

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
      } catch (err) {
        loggerModule.error(err);
        await timeModule.sleep(2000);
      }
    }
  }

  resetMediaIndex(mediaCount: number) {
    let nextMediaIndex: number;
    if (envSettings.randomOrder) {
      nextMediaIndex = Math.floor(Math.random() * (mediaCount + 1));
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
    if (this.specifiedMediaIndex !== null) {
      const media = medias[this.specifiedMediaIndex] || null;
      this.specifiedMediaIndex = null;
      return media;
    } else {
      this.resetMediaIndex(medias.length);
      return medias[this.currentMediaIndex] || null;
    }
  }

  async next() {
    await this.stop();
    await this.play();
  }

  async play(order?: string) {
    if (order !== undefined) {
      const media = await mediaModule.getMediaByOrderString(order);
      this.specifiedMediaIndex = media.order - 1;
    }

    this.from = "muteAudio";
    this.stopped = false;

    this.killReaderTask();
  }

  async stop() {
    this.from = "muteAudio";
    this.stopped = true;
    this.killReaderTask();
  }

  killReaderTask() {
    const task = this.readerTask;
    if (task && !task.killed) {
      task.kill("SIGKILL");
      setTimeout(() => {
        if (!task.killed) {
          task.kill("SIGKILL");
        }
      }, 1000);
    }
  }
}

export const fmModule = new FMModule();
