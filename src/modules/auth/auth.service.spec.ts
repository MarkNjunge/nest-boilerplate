import { AuthService } from "./auth.service";

describe("AuthService", () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
  });

  describe("validateUser", () => {
    it("returns the token value as userId", () => {
      const result = authService.validateUser("usr_abc123");

      expect(result).toEqual({ userId: "usr_abc123" });
    });
  });

  describe("validateAdmin", () => {
    it("returns true for the configured admin key", () => {
      expect(authService.validateAdmin("api-key")).toBe(true);
    });

    it("returns false for an invalid key", () => {
      expect(authService.validateAdmin("wrong-key")).toBe(false);
    });
  });
});
