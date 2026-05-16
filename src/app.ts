import express, { Application } from "express";
import pinoHttp from "pino-http";
import { randomUUID } from "node:crypto";
import { logger } from "./logger";

export function createApp(): Application {
  const app = express();

  app.use(express.json({ limit: "100kb" }));

  app.use(
    pinoHttp({
      logger,
      genReqId: (req, res) => {
        const incoming = req.headers["x-request-id"];
        const id =
          typeof incoming === "string" && incoming.length > 0
            ? incoming
            : randomUUID();
        res.setHeader("x-request-id", id);
        return id;
      },
    })
  );

  return app;
}
