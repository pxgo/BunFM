import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { loggerModule } from "../modules/logger";
dotenv.config();

class EnvSettings {
  host: string = process.env.BUN_FM_HOST || "127.0.0.1";
  port: number = parseInt(process.env.BUN_FM_PORT || "7080");
  botToken: string = process.env.BUN_FM_BOT_TOKEN || "";
  tmpDir: string = process.env.BUN_FM_TMP_DIR || "./tmp";
  mediaDir: string = process.env.BUN_FM_AUDIO_DIR || "./media";
  randomOrder: boolean = process.env.BUN_FM_RANDOM_ORIGIN === "true";

  constructor() {
    if (!this.botToken) {
      loggerModule.errorExit("No bot token provided");
    }
    this.tmpDir = this.fixDir(this.tmpDir);
    this.mediaDir = this.fixDir(this.mediaDir);
  }

  private fixDir(dir: string) {
    if (!path.isAbsolute(dir)) {
      dir = path.resolve(process.cwd(), dir);
    }
    fs.mkdirSync(dir, { recursive: true });
    return dir;
  }
}

export const envSettings = new EnvSettings();
