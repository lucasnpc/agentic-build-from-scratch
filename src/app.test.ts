import request from "supertest";
import { createApp } from "./app";

describe("GET /health", () => {
  it("returns 200 with {status:'ok'}", async () => {
    const res = await request(createApp()).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});

describe("unknown route", () => {
  it("returns 404 in the same structured-error shape", async () => {
    const res = await request(createApp()).get("/no-such-thing");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("not_found");
    expect(res.body.error.message).toMatch(/no-such-thing/);
  });
});
