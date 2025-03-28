import dayjs from "dayjs";

class TimeModule {
  now() {
    return dayjs().format("YYYY-MM-DD HH:mm:ss");
  }

  sleep(time: number) {
    return new Promise((resolve) => setTimeout(resolve, time));
  }
}

export const timeModule = new TimeModule();
