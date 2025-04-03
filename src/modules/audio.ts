import { EventEmitter } from "eventemitter3";
import { loggerModule } from "./logger";
import { spawn, ChildProcess } from "child_process";

interface IEvents {
  muteAudio: (chunk: Buffer) => void;
}

class AudioModule extends EventEmitter<IEvents> {
  constructor() {
    super();
  }

  async init() {
    this.initMuteAudioCreator().catch((err) => {
      loggerModule.errorExit(err);
    });
  }

  async initMuteAudioCreator() {
    return new Promise((resolve, reject) => {
      const muteAudioTask = spawn(
        "ffmpeg",
        [
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
          "mp3",
          "pipe:1",
        ],
        {
          stdio: ["ignore", "pipe", "inherit"],
        },
      );
      muteAudioTask.on("close", (code) => {
        reject(code);
      });
      muteAudioTask.stdout.on("data", (buf: Buffer) => {
        this.emit("muteAudio", buf);
      });
    });
  }

  async readAudioFile(
    filePath: string,
    onTask: (task: ChildProcess) => void,
    onBuffer: (buffer: Buffer) => void,
  ) {
    return new Promise<void>((resolve, reject) => {
      const task = spawn(
        "ffmpeg",
        [
          "-v",
          "quiet",
          "-re",
          "-i",
          filePath,
          "-vn",
          "-ar",
          "44100",
          "-ac",
          "2",
          "-map_metadata",
          "-1",
          "-write_id3v2",
          "0",
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

      let timer: NodeJS.Timeout | undefined;

      const clearTimer = () => {
        clearTimeout(timer);
      };

      const setTimer = () => {
        clearTimer();
        timer = setTimeout(() => {
          loggerModule.error(new Error("Read file timeout"));
          task.kill("SIGKILL");
        }, 3 * 1000);
      };

      task.on("close", () => {
        resolve();
        clearTimer();
      });

      task.on("error", (err) => {
        reject(err);
        clearTimer();
      });

      task.stdout.on("data", (buf: Buffer) => {
        onBuffer(buf);
        setTimer();
      });

      onTask(task);
    });
  }
}

export const audioModule = new AudioModule();
