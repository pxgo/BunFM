import fs from "fs";
import { envSettings } from "@/settings/env.ts";
import type { IMedia } from "@/settings/media.ts";
import path from "path";

class MediaModule {
  async getMediasInfo() {
    const medias: IMedia[] = [];
    const filenames = await fs.promises.readdir(envSettings.mediaDir);
    for (const filename of filenames) {
      const filePath = path.resolve(envSettings.mediaDir, filename);
      medias.push({
        filename,
        filePath,
      });
    }
    return medias;
  }

  async getMediaNames() {
    const medias = await this.getMediasInfo();
    return medias.map((media) => media.filename);
  }
}

export const mediaModule = new MediaModule();
