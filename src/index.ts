import express from "express";
import { botModule } from "./modules/bot";
import { audioModule } from "./modules/audio";
import { loggerModule } from "./modules/logger";
import { fmModule } from "./modules/fm";
import { envSettings } from "./settings/env";

const app = express();

app.get("/*", async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "audio/mp3");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  const onFMData = (buffer: Buffer) => {
    if (res.writable) {
      res.write(buffer);
    }
  };
  fmModule.on("fmData", onFMData);
  res.socket?.on("close", () => {
    fmModule.off("fmData", onFMData);
  });
  req.socket.on("close", () => {
    fmModule.off("fmData", onFMData);
  });
});

app.listen(envSettings.port, envSettings.host, async () => {
  try {
    loggerModule.info(
      `Server is running at http://${envSettings.host}:${envSettings.port}.`,
    );
    await botModule.init();
    await audioModule.init();
    await fmModule.init();
  } catch (err) {
    loggerModule.error(err);
  }
});
