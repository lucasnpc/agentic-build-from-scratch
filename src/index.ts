import { createApp } from "./app";
import { loadConfig } from "./config";
import { logger } from "./logger";

function main(): void {
  const config = loadConfig();
  const app = createApp();

  app.listen(config.port, () => {
    logger.info({ port: config.port }, "bookmark-manager-api listening");
  });
}

main();
