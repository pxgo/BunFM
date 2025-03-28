import { timeModule } from "@/modules/time.ts";
class LoggerModule {
  debug(...args: any[]) {
    console.log(`[${timeModule.now()}][DEBUG]`, ...args);
  }

  error(...args: any[]) {
    console.error(`[${timeModule.now()}][ERROR]`, ...args);
  }

  info(...args: any[]) {
    console.info(`[${timeModule.now()}][ERROR]`, ...args);
  }

  errorExit(...args: any[]) {
    this.error(...args);
    process.exit(1);
  }
}

export const loggerModule = new LoggerModule();
