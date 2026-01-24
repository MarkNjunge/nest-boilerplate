import { AuthService } from "./auth.service";
import { config } from "@/config";

describe("AuthService", () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
  });

  describe("validateToken", () => {
    it("returns user when token matches apiKey", () => {
      const result = authService.validateToken(config.apiKey);

      expect(result).toEqual({ userId: "sample-user-id" });
    });

    it("returns null when token does not match", () => {
      const result = authService.validateToken("invalid-token");

      expect(result).toBeNull();
    });

    it("returns null when token is empty", () => {
      const result = authService.validateToken("");

      expect(result).toBeNull();
    });
  });
});
