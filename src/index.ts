import { createApp } from "./app";
import { loadConfig } from "./config";
import { logger } from "./logger";

function main(): void {
  const config = loadConfig();
  const app = createApp();

  const server = app.listen(config.port, () => {
    logger.info({ port: config.port }, "bookmark-manager-api listening");
  });

  const shutdown = (signal: NodeJS.Signals): void => {
    logger.info({ signal }, "shutting down");
    server.close((err) => {
      if (err) {
        logger.error({ err }, "error while closing server");
        process.exit(1);
      }
      process.exit(0);
    });
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  process.on("unhandledRejection", (reason) => {
    logger.error({ reason }, "unhandled promise rejection");
  });
}

main();
