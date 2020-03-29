import { Test, TestingModule } from "@nestjs/testing";
import { UsersService } from "./users.service";
import { getRepositoryToken } from "@nestjs/typeorm";
import { UserEntity } from "./entitiy/User.entity";
import { Repository } from "typeorm";
import { AddressEntity } from "./entitiy/Address.entity";
import { CreateUserDto } from "./dto/CreateUser.dto";
import { UserDto } from "./dto/user.dto";
import { CreateAddressDto } from "./dto/CreateAddress.dto";
import { AddressDto } from "./dto/address.dto";

describe("UsersService", () => {
  let usersService: UsersService;
  let usersRepository: Repository<UserEntity>;
  let addressRepository: Repository<AddressEntity>;

  const createAddressDto: CreateAddressDto = {
    city: "Nairobi",
    country: "Kenya",
  };
  const address: AddressDto = { id: 1, city: "Nairobi", country: "Kenya" };
  const createUserDto: CreateUserDto = {
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
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

    usersService = module.get<UsersService>(UsersService);
    usersRepository = module.get(getRepositoryToken(UserEntity));
    addressRepository = module.get(getRepositoryToken(AddressEntity));
  });

  describe("getAllUsers", () => {
    it("should return an array", async () => {
      jest
        .spyOn(usersRepository, "find")
        .mockImplementation(() => Promise.resolve([user as UserEntity]));

      const actual = await usersService.getAllUsers();
      expect(actual).toEqual([user]);
    });
  });

  describe("createUser", () => {
    it("shoud return an object", async () => {
      jest
        .spyOn(usersRepository, "save")
        .mockImplementation(() => Promise.resolve(user as UserEntity));

      const actual = await usersService.createUser(createUserDto);
      expect(actual).toEqual(user);
    });
  });

  describe("createAddress", () => {
    it("should return an object", async () => {
      jest
        .spyOn(addressRepository, "save")
        .mockImplementation(() => Promise.resolve(address as AddressEntity));

      const actual = await usersService.createAddress(1, createAddressDto);
      expect(actual).toEqual(address);
    });
  });
});
