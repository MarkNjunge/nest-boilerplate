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
import { ApiResponseDto } from "src/common/dto/ApiResponse.dto";
import { UpdateContactDto } from "./dto/UpdateContact.dto";
import { UpdateUserDto } from "./dto/UpdateUser.dto";

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

    const user = UserEntity.fromCreateDto(dto);

    const created = await this.usersRepository.save(user);
    return created;
  }

  async createAddress(id: number, dto: CreateAddressDto): Promise<AddressDto> {
    this.logger.debug(`Creating address ${JSON.stringify(dto)}`);

    const address = AddressEntity.fromCreateDto(id, dto);

    const created = await this.addressesRepository.save(address);
    console.log(created);
    delete created.user;
    return created;
  }

  async updateUser(id: number, dto: UpdateUserDto) {
    this.logger.log(`Updating user ${id}: ${JSON.stringify(dto)}`);

    // Workaround method: https://github.com/typeorm/typeorm/issues/4477#issuecomment-579142518
    const existing = await this.usersRepository.findOne({ id });
    const updated = UserEntity.fromUpdateDto(dto);
    await this.usersRepository.merge(existing, updated);
    return this.usersRepository.save(existing);
  }

  async deleteUser(userId: number) {
    this.logger.debug(`Deleting user ${userId}`);

    return this.usersRepository.delete({ id: userId });
  }
}
