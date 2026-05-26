import { AuthService } from "./auth.service";

describe("AuthService", () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
  });

  describe("validateToken", () => {
    it("returns the token value as userId", () => {
      const result = authService.validateToken("usr_abc123");

      expect(result).toEqual({ userId: "usr_abc123" });
    });
  });
});
