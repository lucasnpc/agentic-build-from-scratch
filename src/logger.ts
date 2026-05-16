import pino from "pino";
import { loadConfig } from "./config";

const { logLevel } = loadConfig();

export const logger = pino({
  level: logLevel,
  base: { service: "bookmark-manager-api" },
  timestamp: pino.stdTimeFunctions.isoTime,
});
