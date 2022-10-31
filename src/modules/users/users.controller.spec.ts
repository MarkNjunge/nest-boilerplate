/* eslint-disable max-nested-callbacks,max-lines-per-function */
import { Test, TestingModule } from "@nestjs/testing";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { UserDto, CreateUserDto } from "@/models/user";
import { CreateAddressDto, AddressDto } from "@/models/address";
import { emptyCtx } from "@/decorators/request-context.decorator";

describe("Users Controller", () => {
  let usersController: UsersController;
  let usersService: UsersService;

  const createAddressDto: CreateAddressDto = {
    city: "Nairobi",
    country: "Kenya",
  };
  const address: AddressDto = { id: 1, city: "Nairobi", country: "Kenya" };
  const createUserDto = {
    username: "Mark",
    contact: {
      email: "mark@mail.com",
    },
  };
  const user: UserDto = {
    id: 1,
    username: "Mark",
    contact: {
      id: 1,
      email: "mark@mail.com",
    },
    addresses: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [ UsersService ],
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
        .spyOn(usersService, "list")
        .mockImplementation(async () => Promise.resolve([user]));

      expect(await usersController.list(emptyCtx(), "")).toEqual([user]);
    });
  });

  describe("createUser", () => {
    it("should return created user", async () => {
      jest
        .spyOn(usersService, "create")
        .mockImplementation(async () => Promise.resolve(user));

      expect(await usersController.create(emptyCtx(), createUserDto as CreateUserDto)).toBe(user);
    });
  });

  describe("createAddress", () => {
    it("should return body", async () => {
      jest
        .spyOn(usersService, "createAddress")
        .mockImplementation(async () => Promise.resolve(address));

      expect(await usersController.createAddress(emptyCtx(), 1, createAddressDto)).toBe(
        address,
      );
    });
  });
});
