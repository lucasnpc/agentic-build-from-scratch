import { createInMemoryRepository } from "./repository";

describe("in-memory bookmark repository", () => {
  it("round-trips a bookmark on create + get", () => {
    const repo = createInMemoryRepository();
    const created = repo.create({
      url: "https://example.com/article",
      title: "Example article",
      description: "for testing",
      tags: ["reading", "Reading", " example "],
    });

    expect(created.id).toMatch(/[0-9a-f-]{36}/);
    expect(created.createdAt).toBe(created.updatedAt);
    expect(created.tags).toEqual(["reading", "example"]);

    const fetched = repo.get(created.id);
    expect(fetched).toEqual(created);
  });

  it("lists newest first and filters by tag", () => {
    const repo = createInMemoryRepository();
    const a = repo.create({ url: "https://a.test", title: "A", tags: ["x"] });
    const b = repo.create({ url: "https://b.test", title: "B", tags: ["y"] });
    const c = repo.create({ url: "https://c.test", title: "C", tags: ["x", "z"] });

    const all = repo.list();
    expect(all.map((bk) => bk.id)).toEqual([c.id, b.id, a.id]);

    const onlyX = repo.list({ tag: "x" });
    expect(onlyX.map((bk) => bk.id)).toEqual([c.id, a.id]);

    expect(repo.list({ tag: "missing" })).toEqual([]);
  });

  it("updates partial fields and bumps updatedAt", async () => {
    const repo = createInMemoryRepository();
    const created = repo.create({ url: "https://a.test", title: "A" });

    await new Promise((r) => setTimeout(r, 10));
    const updated = repo.update(created.id, { title: "A renamed" });
    expect(updated).not.toBeNull();
    expect(updated!.title).toBe("A renamed");
    expect(updated!.url).toBe(created.url);
    expect(updated!.updatedAt > created.updatedAt).toBe(true);

    expect(repo.update("does-not-exist", { title: "x" })).toBeNull();
  });

  it("deletes and reports whether it existed", () => {
    const repo = createInMemoryRepository();
    const created = repo.create({ url: "https://a.test", title: "A" });

    expect(repo.delete(created.id)).toBe(true);
    expect(repo.delete(created.id)).toBe(false);
    expect(repo.get(created.id)).toBeNull();
  });
});
