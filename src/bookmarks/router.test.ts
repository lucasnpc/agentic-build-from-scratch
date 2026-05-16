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
