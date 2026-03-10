import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../app.js";

describe("Backend app", () => {
  it("GET /health returns ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("GET /api/health returns ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("GET /api/wallet requires auth", async () => {
    const res = await request(app).get("/api/wallet");
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Unauthorized");
  });
});
