import express from "express";
import { botModule } from "./modules/bot";
import { audioModule } from "./modules/audio";
import { loggerModule } from "./modules/logger";
import { fmModule } from "./modules/fm";
import { envSettings } from "./settings/env";
import { metadataSettings } from "./settings/metadata";

const app = express();

app.use(express.static("public"));

app.get("/*", async (req, res) => {
  res.setHeader("Bun-FM-Name", metadataSettings.nickname);
  res.setHeader("Bun-FM-Description", metadataSettings.description);
  res.setHeader("Bun-FM-Version", metadataSettings.version);
  res.setHeader("Bun-FM-Author", `${metadataSettings.author}`);
  res.setHeader("Bun-FM-URL", `${metadataSettings.homePage}`);
  res.setHeader("Bun-FM-Icon", `/icon.jpg`);
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
