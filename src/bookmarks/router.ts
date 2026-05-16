import { Router } from "express";
import { CreateBookmarkSchema } from "./schemas";
import type { BookmarkRepository } from "./repository";

export function createBookmarkRouter(repo: BookmarkRepository): Router {
  const router = Router();

  router.post("/", (req, res, next) => {
    try {
      const payload = CreateBookmarkSchema.parse(req.body);
      const bookmark = repo.create(payload);
      req.log?.info({ bookmarkId: bookmark.id }, "bookmark created");
      res.status(201).json(bookmark);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
