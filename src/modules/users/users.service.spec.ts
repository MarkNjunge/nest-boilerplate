import { Test, TestingModule } from "@nestjs/testing";
import { UsersService } from "./users.service";
import { AddressDto, CreateAddressDto } from "@/models/address";
import { UserModel } from "@/models/user/user.model";
import { emptyCtx } from "@/decorators/request-context.decorator";
import { CreateUserDto } from "@/models/user";
import { AddressModel } from "@/models/address/address.model";
import { DbService } from "@/modules/_db/db.service";

const mockDbService = {
  user: {
    list: jest.fn(),
    create: jest.fn(),
    get: jest.fn(),
  },
  address: {
    create: jest.fn(),
  },
  contact: {}
};

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
        { provide: DbService, useValue: mockDbService },
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
  });

  describe("getAllUsers", () => {
    it("should return an array", async () => {
      jest
        .spyOn(mockDbService.user, "list")
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
        .spyOn(mockDbService.user, "create")
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
        .spyOn(mockDbService.address, "create")
        .mockImplementation(async () =>
          Promise.resolve(address as AddressModel),
        );

      jest
        .spyOn(mockDbService.user, "get")
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
