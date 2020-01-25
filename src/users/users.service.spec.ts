import { Test, TestingModule } from "@nestjs/testing";
import { UsersService } from "./users.service";
import { UserDto } from "./dto/user.dto";

describe("UsersService", () => {
  let usersService: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
  });

  describe("getAllUsers", () => {
    it("should return a list", async () => {
      const actual = await usersService.getAllUsers();
      expect(Array.isArray(actual)).toBe(true);
    });
  });

  describe("createUser", () => {
    it("shoud return an object", async () => {
      const dto: UserDto = {
        username: "Mark",
        address: { city: "Nairobi", country: { code: "KE", name: "Kenya" } },
      };
      const actual = await usersService.createUser(dto);
      expect(typeof actual).toBe("object");
    });
  });
});
