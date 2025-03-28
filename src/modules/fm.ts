import { envSettings } from "@/settings/env.ts";
import { mediaModule } from "@/modules/media.ts";
import EventEmitter from "eventemitter3";
import { loggerModule } from "@/modules/logger.ts";
import { timeModule } from "@/modules/time.ts";
import { audioModule } from "@/modules/audio.ts";

interface IEvents {
  fmData: (chunk: Uint8Array) => void;
}

class FMModule extends EventEmitter<IEvents> {
  currentMediaIndex: number = -1;
  from: "file" | "muteAudio" = "muteAudio";

  constructor() {
    super();
    audioModule.on("muteAudio", (chunk) => {
      this.emitFMData("muteAudio", chunk);
    });
  }

  private emitFMData(from: "file" | "muteAudio", chunk: Uint8Array) {
    if (from === this.from) {
      this.emit("fmData", chunk);
    }
  }

  async init() {
    while (true) {
      this.from = "muteAudio";
      try {
        const medias = await mediaModule.getMediasInfo();
        if (medias.length === 0) {
          loggerModule.info("No audio file found.");
          await timeModule.sleep(2000);
          continue;
        }
        const nextMediaIndex = this.getNextMediaIndex(medias.length);
        const mediaInfo = medias[nextMediaIndex];
        await audioModule.readAudioFile(mediaInfo.filePath, (chunk) => {
          this.from = "file";
          this.emitFMData("file", chunk);
        });
      } catch (err) {
        loggerModule.error(err);
        await timeModule.sleep(2000);
      }
    }
  }
  getNextMediaIndex(mediaCount: number) {
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
    return nextMediaIndex;
  }
}

export const fmModule = new FMModule();
