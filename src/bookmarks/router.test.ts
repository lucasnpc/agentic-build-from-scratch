import request from "supertest";
import { createApp } from "../app";
import { createInMemoryRepository } from "./repository";

function buildApp() {
  const repository = createInMemoryRepository();
  const app = createApp({ repository });
  return { app, repository };
}

describe("POST /bookmarks", () => {
  it("creates a bookmark and returns 201 with the persisted resource", async () => {
    const { app, repository } = buildApp();

    const res = await request(app)
      .post("/bookmarks")
      .send({
        url: "https://example.com/article",
        title: "Example article",
        description: "a sample",
        tags: ["Reading", "reading", "example"],
      });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      url: "https://example.com/article",
      title: "Example article",
      description: "a sample",
      tags: ["reading", "example"],
    });
    expect(res.body.id).toMatch(/[0-9a-f-]{36}/);
    expect(res.body.createdAt).toBeDefined();
    expect(res.headers["x-request-id"]).toBeDefined();

    const stored = repository.get(res.body.id);
    expect(stored).not.toBeNull();
    expect(stored!.title).toBe("Example article");
  });

  it("returns 400 with structured error when the URL is malformed", async () => {
    const { app } = buildApp();

    const res = await request(app)
      .post("/bookmarks")
      .send({ url: "not-a-url", title: "Bad" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("validation_error");
    expect(res.body.error.details).toBeDefined();
    expect(res.body.error.requestId).toBeDefined();
  });

  it("returns 400 when the title is an empty string", async () => {
    const { app } = buildApp();

    const res = await request(app)
      .post("/bookmarks")
      .send({ url: "https://example.com", title: "   " });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("validation_error");
  });

  it("returns 400 on malformed JSON instead of crashing", async () => {
    const { app } = buildApp();

    const res = await request(app)
      .post("/bookmarks")
      .set("content-type", "application/json")
      .send("{ not json");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("malformed_json");
  });
});

describe("GET /bookmarks", () => {
  it("returns an empty list when nothing has been created", async () => {
    const { app } = buildApp();
    const res = await request(app).get("/bookmarks");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ items: [], count: 0 });
  });

  it("lists newest first and filters by tag (happy path)", async () => {
    const { app, repository } = buildApp();
    repository.create({ url: "https://a.test", title: "A", tags: ["news"] });
    repository.create({ url: "https://b.test", title: "B", tags: ["tech"] });
    repository.create({ url: "https://c.test", title: "C", tags: ["news", "tech"] });

    const all = await request(app).get("/bookmarks");
    expect(all.status).toBe(200);
    expect(all.body.count).toBe(3);
    expect(all.body.items.map((b: { title: string }) => b.title)).toEqual([
      "C",
      "B",
      "A",
    ]);

    const filtered = await request(app).get("/bookmarks?tag=news");
    expect(filtered.status).toBe(200);
    expect(filtered.body.count).toBe(2);
    expect(filtered.body.items.map((b: { title: string }) => b.title)).toEqual([
      "C",
      "A",
    ]);
  });

  it("returns an empty list when the tag filter matches nothing (edge case)", async () => {
    const { app, repository } = buildApp();
    repository.create({ url: "https://a.test", title: "A", tags: ["news"] });

    const res = await request(app).get("/bookmarks?tag=nope");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ items: [], count: 0 });
  });

  it("returns 400 when an unknown query param is supplied", async () => {
    const { app } = buildApp();
    const res = await request(app).get("/bookmarks?weird=1");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("validation_error");
  });
});

describe("GET /bookmarks/:id", () => {
  it("returns the bookmark when it exists (happy path)", async () => {
    const { app, repository } = buildApp();
    const created = repository.create({
      url: "https://example.com",
      title: "Example",
    });

    const res = await request(app).get(`/bookmarks/${created.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(created.id);
    expect(res.body.title).toBe("Example");
  });

  it("returns 404 with a structured body when the id is unknown (edge case)", async () => {
    const { app } = buildApp();
    const res = await request(app).get("/bookmarks/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("not_found");
    expect(res.body.error.message).toMatch(/does-not-exist/);
    expect(res.body.error.requestId).toBeDefined();
  });
});

describe("PUT /bookmarks/:id", () => {
  it("partially updates a bookmark and returns it (happy path)", async () => {
    const { app, repository } = buildApp();
    const created = repository.create({
      url: "https://example.com",
      title: "Original",
      tags: ["news"],
    });

    const res = await request(app)
      .put(`/bookmarks/${created.id}`)
      .send({ title: "Renamed", tags: ["Tech", "tech"] });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Renamed");
    expect(res.body.url).toBe(created.url); // untouched
    expect(res.body.tags).toEqual(["tech"]);
    expect(res.body.updatedAt >= created.updatedAt).toBe(true);
  });

  it("returns 400 when the URL in the update is malformed (error case)", async () => {
    const { app, repository } = buildApp();
    const created = repository.create({
      url: "https://example.com",
      title: "Original",
    });

    const res = await request(app)
      .put(`/bookmarks/${created.id}`)
      .send({ url: "not-a-url" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("validation_error");
    const stored = repository.get(created.id);
    expect(stored!.url).toBe("https://example.com");
  });

  it("returns 400 when the update body is empty", async () => {
    const { app, repository } = buildApp();
    const created = repository.create({ url: "https://example.com", title: "x" });
    const res = await request(app).put(`/bookmarks/${created.id}`).send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("validation_error");
  });

  it("returns 404 when the bookmark does not exist", async () => {
    const { app } = buildApp();
    const res = await request(app)
      .put("/bookmarks/does-not-exist")
      .send({ title: "x" });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("not_found");
  });
});
