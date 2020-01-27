import { Test, TestingModule } from "@nestjs/testing";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { getRepositoryToken } from "@nestjs/typeorm";
import { UserEntity } from "./entitiy/User.entity";
import { Repository } from "typeorm";
import { AddressEntity } from "./entitiy/Address.entity";

describe("Users Controller", () => {
  let usersController: UsersController;
  let usersService: UsersService;

  const createAddressDto = { city: "Nairobi", country: "Kenya", userId: 1 };
  const address = { id: 1, city: "Nairobi", country: "Kenya" };
  const createUserDto = {
    username: "Mark",
  };
  const user = {
    id: 1,
    username: "Mark",
    addresses: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(UserEntity),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(AddressEntity),
          useClass: Repository,
        },
      ],
    }).compile();

    usersController = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
  });

  it("should be defined", () => {
    expect(usersController).toBeDefined();
  });

  describe("getAllUsers", () => {
    it("should return array", async () => {
      jest
        .spyOn(usersService, "getAllUsers")
        .mockImplementation(() => Promise.resolve([user]));

      expect(await usersController.getAllUsers()).toEqual([user]);
    });
  });

  describe("createUser", () => {
    it("should return created user", async () => {
      jest
        .spyOn(usersService, "createUser")
        .mockImplementation(() => Promise.resolve(user));

      expect(await usersController.createUser(createUserDto)).toBe(user);
    });
  });

  describe("createAddress", () => {
    it("should return body", async () => {
      jest
        .spyOn(usersService, "createAddress")
        .mockImplementation(() => Promise.resolve(address));

      expect(await usersController.createAddress(createAddressDto)).toBe(
        address,
      );
    });
  });
});
