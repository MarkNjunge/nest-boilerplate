import { Inject, Injectable } from "@nestjs/common";
import { Logger } from "@/logging/Logger";
import { blankQuery, ErrorCodes, HttpException, Query } from "@/utils";
import { CreateUserDto, UpdateUserDto, UserDto } from "@/models/user";
import { AddressDto, CreateAddressDto } from "@/models/address";
import { IReqCtx } from "@/decorators/request-context.decorator";
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
import opentelemetry from "@opentelemetry/api";

@Injectable()
export class UsersService {
  private logger = new Logger("UsersService");
  private fetches = "[contact,addresses]";
  private meter = opentelemetry.metrics.getMeter("UserService");
  private counters = {
    get: this.meter.createCounter("get_user"),
    create: this.meter.createCounter("create_user"),
  };

  constructor(
    @Inject(USER_REPOSITORY)
    protected readonly userRepo: UserRepository,
    @Inject(ADDRESS_REPOSITORY)
    protected readonly addressRepo: AddressRepository,
    @Inject(CONTACT_REPOSITORY)
    protected readonly contactRepo: ContactRepository,
  ) {}

  async get(ctx: IReqCtx, id: number): Promise<UserDto> {
    this.logger.debug(`Get user ${id}`);
    this.counters.get.add(1, { user_id: id });
    const user = await this.userRepo.get(id, this.fetches);
    if (!user) {
      throw new HttpException(
        404,
        `User ${id} does not exist`,
        ErrorCodes.INVALID_USER,
        { id },
      );
    }

    return user;
  }

  async create(ctx: IReqCtx, data: CreateUserDto): Promise<UserDto> {
    this.logger.debug(`Creating user ${data.username}`, { data });
    this.counters.create.add(1);
    return this.userRepo.create(data);
  }

  async createBulk(ctx: IReqCtx, data: CreateUserDto[]): Promise<UserDto[]> {
    this.logger.debug(`Creating ${data.length} users`, { data });
    return this.userRepo.createBulk(data);
  }

  async list(ctx: IReqCtx, query: Query = blankQuery()): Promise<UserDto[]> {
    return this.userRepo.list(query, this.fetches);
  }

  async update(
    ctx: IReqCtx,
    id: number,
    data: UpdateUserDto,
  ): Promise<UserDto> {
    await this.get(ctx, id);
    this.logger.debug(`Updating user ${id}`, { data });
    await this.contactRepo
      .query()
      .patch({ email: data.contact.email })
      .where("user_id", "=", id);
    return this.userRepo.updateById(id, data, this.fetches);
  }

  async delete(ctx: IReqCtx, id: number): Promise<number> {
    this.logger.debug(`Deleting user ${id}`, { data: { id } });
    return this.userRepo.deleteById(id);
  }

  async createAddress(
    ctx: IReqCtx,
    id: number,
    data: CreateAddressDto,
  ): Promise<AddressDto> {
    this.logger.debug(`Creating address for user ${id}`, { data });

    const user = await this.get(ctx, id);
    data.userId = user.id;

    return this.addressRepo.create(data);
  }
}
