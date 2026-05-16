import express, { Application } from "express";
import pinoHttp from "pino-http";
import { randomUUID } from "node:crypto";
import { logger } from "./logger";
import { createBookmarkRouter } from "./bookmarks/router";
import { createInMemoryRepository, type BookmarkRepository } from "./bookmarks/repository";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

export interface AppDeps {
  repository?: BookmarkRepository;
}

export function createApp(deps: AppDeps = {}): Application {
  const repository = deps.repository ?? createInMemoryRepository();
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

  app.use((req, _res, next) => {
    req.log?.info({ method: req.method, path: req.path }, "request received");
    next();
  });

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.use("/bookmarks", createBookmarkRouter(repository));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
