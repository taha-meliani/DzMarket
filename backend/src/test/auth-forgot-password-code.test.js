import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const findByEmail = vi.fn();
const updatePasswordHash = vi.fn();
const getLatestActiveForUser = vi.fn();
const consumeAllForUser = vi.fn();
const createResetRequest = vi.fn();
const getById = vi.fn();
const consumeById = vi.fn();
const sendPasswordResetCodeEmail = vi.fn();

vi.mock("../models/user.model.js", () => ({
  userModel: {
    findByEmail,
    updatePasswordHash,
  },
}));

vi.mock("../models/password-reset.model.js", () => ({
  passwordResetModel: {
    getLatestActiveForUser,
    consumeAllForUser,
    create: createResetRequest,
    getById,
    consumeById,
    incrementAttempts: vi.fn(),
    markVerified: vi.fn(),
  },
}));

vi.mock("../services/email.service.js", () => ({
  sendPasswordResetCodeEmail,
}));

const { app } = await import("../app.js");

describe("Auth forgot password with code", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("POST /api/auth/forgot-password/request sends code for existing email", async () => {
    findByEmail.mockResolvedValue({ id: "u_1", email: "user@example.com" });
    getLatestActiveForUser.mockResolvedValue(null);
    consumeAllForUser.mockResolvedValue({ count: 0 });
    createResetRequest.mockResolvedValue({ id: "r_1" });
    sendPasswordResetCodeEmail.mockResolvedValue(undefined);

    const res = await request(app).post("/api/auth/forgot-password/request").send({ email: "user@example.com" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(sendPasswordResetCodeEmail).toHaveBeenCalledTimes(1);
  });

  it("POST /api/auth/forgot-password/request rejects unknown email", async () => {
    findByEmail.mockResolvedValue(null);

    const res = await request(app).post("/api/auth/forgot-password/request").send({ email: "missing@example.com" });

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/No account/i);
  });

  it("POST /api/auth/forgot-password/reset updates password when verification is valid", async () => {
    getById.mockResolvedValue({
      id: "r_2",
      userId: "u_2",
      consumedAt: null,
      verifiedAt: new Date(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });
    updatePasswordHash.mockResolvedValue({ id: "u_2" });
    consumeAllForUser.mockResolvedValue({ count: 1 });

    const res = await request(app).post("/api/auth/forgot-password/reset").send({
      verificationId: "r_2",
      password: "newStrongPassword123",
      confirmPassword: "newStrongPassword123",
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(updatePasswordHash).toHaveBeenCalledTimes(1);
  });

  it("POST /api/auth/forgot-password/reset rejects invalid reset session", async () => {
    getById.mockResolvedValue(null);

    const res = await request(app).post("/api/auth/forgot-password/reset").send({
      verificationId: "unknown",
      password: "newStrongPassword123",
      confirmPassword: "newStrongPassword123",
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Invalid reset session/i);
  });
});
