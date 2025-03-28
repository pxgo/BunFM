import { serve } from "bun";
import index from "./web/index.html";
import { botModule } from "@/modules/bot.ts";
import { audioModule } from "@/modules/audio.ts";
import { loggerModule } from "@/modules/logger.ts";
import { fmModule } from "@/modules/fm.ts";

async function main() {
  await botModule.init();
  await audioModule.init();
  await fmModule.init();
}

main().catch(loggerModule.error);

const server = serve({
  routes: {
    "/*": index,
    "/fm": {
      async GET(req) {
        let handle: null | ((chunk: Uint8Array) => void) = null;
        const stream = new ReadableStream({
          start(controller) {
            handle = (chunk) => {
              try {
                controller.enqueue(chunk);
              } catch (err) {
                fmModule.off("fmData", handle);
              }
            };
            fmModule.on("fmData", handle);
          },
        });
        req.signal.addEventListener("abort", () => {
          fmModule.off("fmData", handle);
          // stream.cancel();
        });
        return new Response(stream, {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "audio/mp3",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        });
      },
    },
  },

  development: process.env.NODE_ENV !== "production",
});

console.log(`🚀 Server running at ${server.url}`);
