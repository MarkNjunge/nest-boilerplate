/* eslint-disable max-nested-callbacks,max-lines-per-function */
import { Test, TestingModule } from "@nestjs/testing";
import { Repository } from "typeorm";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { getRepositoryToken } from "@nestjs/typeorm";
import { UserEntity, UserDto, CreateUserDto } from "../../models/user";
import { AddressEntity, CreateAddressDto, AddressDto } from "../../models/address";

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
        .spyOn(usersService, "list")
        .mockImplementation(async () => Promise.resolve([user]));

      expect(await usersController.list()).toEqual([user]);
    });
  });

  describe("createUser", () => {
    it("should return created user", async () => {
      jest
        .spyOn(usersService, "create")
        .mockImplementation(async () => Promise.resolve(user));

      expect(await usersController.create(createUserDto as CreateUserDto)).toBe(user);
    });
  });

  describe("createAddress", () => {
    it("should return body", async () => {
      jest
        .spyOn(usersService, "createAddress")
        .mockImplementation(async () => Promise.resolve(address));

      expect(await usersController.createAddress(1, createAddressDto)).toBe(
        address,
      );
    });
  });
});
