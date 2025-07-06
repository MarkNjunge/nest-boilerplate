import { Injectable } from "@nestjs/common";
import { Logger } from "@/logging/Logger";
import { blankQuery, ErrorCodes, HttpException, Query } from "@/utils";
import { CreateUserDto, UpdateUserDto, UserDto } from "@/models/user";
import { AddressDto, CreateAddressDto } from "@/models/address";
import { IReqCtx } from "@/decorators/request-context.decorator";
import opentelemetry from "@opentelemetry/api";
import { DbService } from "@/modules/_db/db.service";

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
    protected readonly db: DbService,
  ) {}

  async get(ctx: IReqCtx, id: number): Promise<UserDto> {
    this.logger.debug(`Get user ${id}`);
    this.counters.get.add(1, { user_id: id });
    const user = await this.db.user.get(id, this.fetches);
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
    return this.db.user.create(data);
  }

  async createBulk(ctx: IReqCtx, data: CreateUserDto[]): Promise<UserDto[]> {
    this.logger.debug(`Creating ${data.length} users`, { data });
    return this.db.user.createBulk(data);
  }

  async list(ctx: IReqCtx, query: Query = blankQuery()): Promise<UserDto[]> {
    return this.db.user.list(query, this.fetches);
  }

  async update(
    ctx: IReqCtx,
    id: number,
    data: UpdateUserDto,
  ): Promise<UserDto> {
    await this.get(ctx, id);
    this.logger.debug(`Updating user ${id}`, { data });
    await this.db.contact
      .query()
      .patch({ email: data.contact.email })
      .where("user_id", "=", id);
    return this.db.user.updateById(id, data, this.fetches);
  }

  async delete(ctx: IReqCtx, id: number): Promise<number> {
    this.logger.debug(`Deleting user ${id}`, { data: { id } });
    return this.db.user.deleteById(id);
  }

  async createAddress(
    ctx: IReqCtx,
    id: number,
    data: CreateAddressDto,
  ): Promise<AddressDto> {
    this.logger.debug(`Creating address for user ${id}`, { data });

    const user = await this.get(ctx, id);
    data.userId = user.id;

    return this.db.address.create(data);
  }
}
