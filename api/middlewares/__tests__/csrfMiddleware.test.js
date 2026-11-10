import { jest } from "@jest/globals";
import { csrfProtection } from "../csrfMiddleware.js";

describe("CSRF Middleware", () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    process.env.NODE_ENV = "production";
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });
  it("should skip CSRF check for GET requests", () => {
    const req = { method: "GET" };
    const res = {};
    const next = jest.fn();

    csrfProtection(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("should block POST request without token", () => {
    const req = { method: "POST", cookies: {}, headers: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    csrfProtection(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: "CSRF token missing or invalid",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should allow POST request with matching cookie and header", () => {
    const token = "secure-random-token";
    const req = {
      method: "POST",
      cookies: { "XSRF-TOKEN": token },
      headers: { "x-xsrf-token": token },
    };
    const res = {};
    const next = jest.fn();

    csrfProtection(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
