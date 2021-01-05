/* eslint-disable max-nested-callbacks,max-lines-per-function */
import { Test, TestingModule } from "@nestjs/testing";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { getRepositoryToken } from "@nestjs/typeorm";
import { UserEntity } from "./entitiy/User.entity";
import { Repository } from "typeorm";
import { AddressEntity } from "./entitiy/Address.entity";
import { UserDto } from "./dto/user.dto";
import { CreateAddressDto } from "./dto/CreateAddress.dto";
import { AddressDto } from "./dto/address.dto";

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
      email: "mark@mail.com",
    },
    addresses: [],
  };

  beforeEach(async() => {
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
    it("should return array", async() => {
      jest
        .spyOn(usersService, "getAllUsers")
        .mockImplementation(() => Promise.resolve([user]));

      expect(await usersController.getAllUsers()).toEqual([user]);
    });
  });

  describe("createUser", () => {
    it("should return created user", async() => {
      jest
        .spyOn(usersService, "createUser")
        .mockImplementation(() => Promise.resolve(user));

      expect(await usersController.createUser(createUserDto)).toBe(user);
    });
  });

  describe("createAddress", () => {
    it("should return body", async() => {
      jest
        .spyOn(usersService, "createAddress")
        .mockImplementation(() => Promise.resolve(address));

      expect(await usersController.createAddress(1, createAddressDto)).toBe(
        address,
      );
    });
  });
});
