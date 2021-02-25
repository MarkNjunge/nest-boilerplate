import { Injectable, NotFoundException } from "@nestjs/common";
import { UserDto } from "./dto/user.dto";
import { CustomLogger } from "../../logging/CustomLogger";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserEntity } from "../../db/entity/User.entity";
import { CreateUserDto } from "./dto/CreateUser.dto";
import { CreateAddressDto } from "./dto/CreateAddress.dto";
import { AddressDto } from "./dto/address.dto";
import { AddressEntity } from "../../db/entity/Address.entity";
import { UpdateUserDto } from "./dto/UpdateUser.dto";
import { ErrorCodes } from "../../common/error-codes";
import { ResponseUtils } from "../../common/util/ResponseUtils";

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
    this.logger.debug(`Creating user ${dto.username}`, null, dto);

    const user = UserEntity.fromCreateDto(dto);
    const saved = await this.usersRepository.save(user);

    return ResponseUtils.cleanObject(UserDto, saved);
  }

  async createAddress(id: number, dto: CreateAddressDto): Promise<AddressDto> {
    this.logger.debug(`Creating address for user ${id}`, null, dto);

    const user = await this.usersRepository.findOne({ id });
    if (user === null) {
      throw new NotFoundException({
        message: `The user ${id} does not exist`,
        code: ErrorCodes.INVALID_USER,
      });
    }

    const address = AddressEntity.fromCreateDto(user, dto);
    const created = await this.addressesRepository.save(address);

    return ResponseUtils.cleanObject(AddressDto, created);
  }

  async updateUser(id: number, dto: UpdateUserDto): Promise<UserDto> {
    this.logger.log(`Updating user ${id}`, null, dto);

    // Workaround method: https://github.com/typeorm/typeorm/issues/4477#issuecomment-579142518
    const existing = await this.usersRepository.findOne({ id });
    if (existing === null) {
      throw new NotFoundException({
        message: `The user ${id} does not exist`,
        code: ErrorCodes.INVALID_USER,
      });
    }
    const updated = UserEntity.fromUpdateDto(dto);
    await this.usersRepository.merge(existing, updated);
    const saved = await this.usersRepository.save(existing);

    return ResponseUtils.cleanObject(UserDto, saved);
  }

  async deleteUser(userId: number): Promise<void> {
    this.logger.debug(`Deleting user ${userId}`, null, { userId });

    await this.usersRepository.delete({ id: userId });
  }
}
