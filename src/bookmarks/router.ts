import { Router } from "express";
import { CreateBookmarkSchema, ListQuerySchema, UpdateBookmarkSchema } from "./schemas";
import { HttpError } from "../errors";
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

  router.get("/", (req, res, next) => {
    try {
      const query = ListQuerySchema.parse(req.query);
      const items = repo.list({ tag: query.tag });
      res.status(200).json({ items, count: items.length });
    } catch (err) {
      next(err);
    }
  });

  router.get("/:id", (req, res, next) => {
    try {
      const bookmark = repo.get(req.params.id);
      if (!bookmark) {
        throw HttpError.notFound(`No bookmark with id ${req.params.id}`);
      }
      res.status(200).json(bookmark);
    } catch (err) {
      next(err);
    }
  });

  router.put("/:id", (req, res, next) => {
    try {
      const patch = UpdateBookmarkSchema.parse(req.body);
      const updated = repo.update(req.params.id, patch);
      if (!updated) {
        throw HttpError.notFound(`No bookmark with id ${req.params.id}`);
      }
      req.log?.info({ bookmarkId: updated.id }, "bookmark updated");
      res.status(200).json(updated);
    } catch (err) {
      next(err);
    }
  });

  router.delete("/:id", (req, res, next) => {
    try {
      const deleted = repo.delete(req.params.id);
      if (!deleted) {
        throw HttpError.notFound(`No bookmark with id ${req.params.id}`);
      }
      req.log?.info({ bookmarkId: req.params.id }, "bookmark deleted");
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });

  return router;
}
