import { Test, TestingModule } from "@nestjs/testing";
import { UsersService } from "./users.service";
import { AddressDto, CreateAddressDto } from "@/models/address";
import {
  USER_REPOSITORY,
  UserRepository,
} from "@/db/repositories/user.repository";
import {
  ADDRESS_REPOSITORY,
  AddressRepository,
} from "@/db/repositories/address.repository";
import {
  CONTACT_REPOSITORY,
  ContactRepository,
} from "@/db/repositories/contact.repository";
import { UserModel } from "@/models/user/user.model";
import { emptyCtx } from "@/decorators/request-context.decorator";
import { CreateUserDto } from "@/models/user";
import { AddressModel } from "@/models/address/address.model";

const mockUserRepository: Partial<UserRepository> = {
  list: jest.fn(),
  create: jest.fn(),
  get: jest.fn(),
};
const mockAddressRepository: Partial<AddressRepository> = {
  create: jest.fn(),
};
const mockContactRepository: Partial<ContactRepository> = {};

describe("UsersService", () => {
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
  const user = {
    id: 1,
    username: "Mark",
    contact: {
      email: "mark@mail.com",
    },
    addresses: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: USER_REPOSITORY, useValue: mockUserRepository },
        { provide: ADDRESS_REPOSITORY, useValue: mockAddressRepository },
        { provide: CONTACT_REPOSITORY, useValue: mockContactRepository },
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
  });

  describe("getAllUsers", () => {
    it("should return an array", async () => {
      jest
        .spyOn(mockUserRepository, "list")
        .mockImplementation(async () =>
          Promise.resolve([user as any as UserModel]),
        );

      const actual = await usersService.list(emptyCtx());
      expect(actual).toEqual([user]);
    });
  });

  describe("createUser", () => {
    it("should return an object", async () => {
      jest
        .spyOn(mockUserRepository, "create")
        .mockImplementation(async () =>
          Promise.resolve(user as any as UserModel),
        );

      const actual = await usersService.create(
        emptyCtx(),
        createUserDto as CreateUserDto,
      );
      expect(actual).toEqual(user);
    });
  });

  describe("createAddress", () => {
    it("should return an object", async () => {
      jest
        .spyOn(mockAddressRepository, "create")
        .mockImplementation(async () =>
          Promise.resolve(address as AddressModel),
        );

      jest
        .spyOn(mockUserRepository, "get")
        .mockImplementation(async () =>
          Promise.resolve(user as any as UserModel),
        );

      const actual = await usersService.createAddress(
        emptyCtx(),
        1,
        createAddressDto,
      );
      expect(actual).toEqual(address);
    });
  });
});
