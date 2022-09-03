import { Injectable } from "@nestjs/common";
import { Logger } from "@/logging/Logger";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ResponseUtils, HttpException, ErrorCodes } from "@/utils";
import { BaseService } from "../_base/base.service";
import { CreateUserDto, UpdateUserDto, UserDto, UserEntity } from "../../models/user";
import { AddressDto, AddressEntity, CreateAddressDto } from "../../models/address";
import { IReqCtx } from "@/decorators/request-context.decorator";

@Injectable()
export class UsersService extends BaseService<UserEntity, UserDto, CreateUserDto, UpdateUserDto> {
  private logger = new Logger("UsersService");

  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(AddressEntity)
    private readonly addressesRepository: Repository<AddressEntity>,
  ) {
    super(UserDto, CreateUserDto, UpdateUserDto, usersRepository);
  }

  async create(ctx: IReqCtx, dto: CreateUserDto): Promise<UserDto> {
    this.logger.debug(`Creating user ${dto.username}`, { data: { dto }, ctx });
    return super.create(ctx, dto);
  }

  async createBulk(ctx: IReqCtx, dtos: CreateUserDto[]): Promise<UserDto[]> {
    this.logger.debug(`Creating ${dtos.length} users`, { data: { dtos }, ctx });
    return super.createBulk(ctx, dtos);
  }

  async update(ctx: IReqCtx, id: number, dto: UpdateUserDto): Promise<UserDto> {
    this.logger.debug(`Updating user ${id}`, { data: { dto }, ctx });
    return super.update(ctx, id, dto);
  }

  async delete(ctx: IReqCtx, id: number): Promise<void> {
    this.logger.debug(`Deleting user ${id}`, { data: { id }, ctx });
    await super.delete(ctx, id);
  }

  async createAddress(ctx: IReqCtx, id: number, dto: CreateAddressDto): Promise<AddressDto> {
    this.logger.debug(`Creating address for user ${id}`, { data: { dto }, ctx });

    const user = await this.usersRepository.findOneBy({ id });
    if (user === null) {
      throw new HttpException(404, `The user ${id} does not exist`, ErrorCodes.INVALID_USER);
    }

    const address = AddressEntity.fromCreateDto(user, dto);
    const created = await this.addressesRepository.save(address);

    return ResponseUtils.cleanObject(AddressDto, created);
  }
}
