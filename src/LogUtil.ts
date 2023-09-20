import * as winston from "winston";

const logger = winston.createLogger({
  level: "debug",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.printf(({ level, message, timestamp }) => {
      return `${timestamp} - ${level.toUpperCase()} - ${message}`;
    })
  ),
  transports: [new winston.transports.Console()],
});

export default class LogUtil {
  public static info(...message: any[]) {
    const strMessage = message
      .map((item) => item.toString())
      .reduce((prev, curr) => prev + " " + curr);
    logger.info(strMessage);
  }

  public static warn(...message: any[]) {
    const strMessage = message
      .map((item) => item.toString())
      .reduce((prev, curr) => prev + " " + curr);
    logger.info(strMessage);
  }

  public static error(...message: any[]) {
    const strMessage = message
      .map((item) => item.toString())
      .reduce((prev, curr) => prev + " " + curr);
    logger.info(strMessage);
  }

  public static debug(...message: any[]) {
    const strMessage = message
      .map((item) => item.toString())
      .reduce((prev, curr) => prev + " " + curr);
    logger.info(strMessage);
  }
}