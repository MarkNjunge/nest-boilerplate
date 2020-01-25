import { Test, TestingModule } from "@nestjs/testing";
import { UsersController } from "./users.controller";
import { UserDto } from "./dto/user.dto";
import { UsersService } from "./users.service";

describe("Users Controller", () => {
  let usersController: UsersController;
  let usersService: UsersService;

  const dto: UserDto = {
    username: "Mark",
    address: { city: "Nairobi", country: { code: "KE", name: "Kenya" } },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [UsersService],
    }).compile();

    usersController = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
  });

  it("should be defined", () => {
    expect(usersController).toBeDefined();
  });

  describe("getAllUsers", () => {
    it("should return list", async () => {
      jest
        .spyOn(usersService, "getAllUsers")
        .mockImplementation(() => Promise.resolve([dto]));

      expect(await usersController.getAllUsers()).toEqual([dto]);
    });
  });

  describe("createUser", () => {
    it("should return body", async () => {
      jest
        .spyOn(usersService, "createUser")
        .mockImplementation(() => Promise.resolve(dto));

      expect(await usersController.createUser(dto)).toBe(dto);
    });
  });
});
