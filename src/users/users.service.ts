import { Injectable } from "@nestjs/common";
import { UserDto } from "./dto/user.dto";
import { CustomLogger } from "../common/CustomLogger";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserEntity } from "./entitiy/User.entity";
import { CreateUserDto } from "./dto/CreateUser.dto";
import { CreateAddressDto } from "./dto/CreateAddress.dto";
import { AddressDto } from "./dto/address.dto";
import { AddressEntity } from "./entitiy/Address.entity";

@Injectable()
export class UsersService {
  private logger = new CustomLogger("UsersService");

  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(AddressEntity)
    private readonly addressesRepository: Repository<AddressEntity>,
  ) {}

  async getAllUsers(): Promise<UserDto[]> {
    return this.usersRepository.find();
  }

  async createUser(dto: CreateUserDto): Promise<UserDto> {
    this.logger.debug(`Creating user ${JSON.stringify(dto)}`);

    const user = new UserEntity();
    user.username = dto.username;

    const created = await this.usersRepository.save(user);
    return { id: created.id, username: created.username, addresses: [] };
  }

  async createAddress(dto: CreateAddressDto): Promise<AddressDto> {
    this.logger.debug(`Creating address ${JSON.stringify(dto)}`);

    const user = new UserEntity();
    user.id = dto.userId;
    const address = new AddressEntity();
    address.city = dto.city;
    address.country = dto.country;
    address.user = user;

    const created = await this.addressesRepository.save(address);
    return { id: created.id, city: created.city, country: created.country };
  }
}
