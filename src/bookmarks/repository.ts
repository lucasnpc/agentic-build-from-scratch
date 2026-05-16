import { randomUUID } from "node:crypto";
import type {
  Bookmark,
  BookmarkUpdate,
  NewBookmarkInput,
} from "./types";

export interface BookmarkRepository {
  create(input: NewBookmarkInput): Bookmark;
  list(filter?: { tag?: string }): Bookmark[];
  get(id: string): Bookmark | null;
  update(id: string, patch: BookmarkUpdate): Bookmark | null;
  delete(id: string): boolean;
  clear(): void;
}

export function createInMemoryRepository(): BookmarkRepository {
  const store = new Map<string, Bookmark>();
  const insertionOrder = new Map<string, number>();
  let sequence = 0;

  function normalizeTags(tags: string[] | undefined): string[] {
    if (!tags) return [];
    const seen = new Set<string>();
    const out: string[] = [];
    for (const raw of tags) {
      const tag = raw.trim().toLowerCase();
      if (tag.length === 0 || seen.has(tag)) continue;
      seen.add(tag);
      out.push(tag);
    }
    return out;
  }

  return {
    create(input) {
      const now = new Date().toISOString();
      const bookmark: Bookmark = {
        id: randomUUID(),
        url: input.url,
        title: input.title,
        description: input.description ?? null,
        tags: normalizeTags(input.tags),
        createdAt: now,
        updatedAt: now,
      };
      store.set(bookmark.id, bookmark);
      insertionOrder.set(bookmark.id, sequence++);
      return bookmark;
    },

    list(filter) {
      const all = Array.from(store.values()).sort((a, b) => {
        const oa = insertionOrder.get(a.id) ?? 0;
        const ob = insertionOrder.get(b.id) ?? 0;
        return ob - oa;
      });
      if (!filter?.tag) return all;
      const wanted = filter.tag.trim().toLowerCase();
      if (wanted.length === 0) return all;
      return all.filter((b) => b.tags.includes(wanted));
    },

    get(id) {
      return store.get(id) ?? null;
    },

    update(id, patch) {
      const existing = store.get(id);
      if (!existing) return null;
      const next: Bookmark = {
        ...existing,
        url: patch.url ?? existing.url,
        title: patch.title ?? existing.title,
        description:
          patch.description === undefined
            ? existing.description
            : patch.description,
        tags: patch.tags === undefined ? existing.tags : normalizeTags(patch.tags),
        updatedAt: new Date().toISOString(),
      };
      store.set(id, next);
      return next;
    },

    delete(id) {
      insertionOrder.delete(id);
      return store.delete(id);
    },

    clear() {
      store.clear();
      insertionOrder.clear();
      sequence = 0;
    },
  };
}
