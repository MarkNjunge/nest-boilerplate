import { Injectable } from "@nestjs/common";
import { Logger } from "@/logging/Logger";
import { ErrorCodes, HttpException, Query } from "@/utils";
import { CreateUserDto, UpdateUserDto, UserDto } from "@/models/user";
import { AddressDto, CreateAddressDto } from "@/models/address";
import { IReqCtx } from "@/decorators/request-context.decorator";
import { UserModel } from "@/models/user/user.model";
import { AddressModel } from "@/models/address/address.model";
import { ContactModel } from "@/models/contact/contact.model";
import { CreateContactDto, UpdateContactDto } from "@/models/contact";
import { BaseRepository } from "@/db/base.repository";

@Injectable()
export class UsersService {
  private logger = new Logger("UsersService");
  private userRepo = new BaseRepository<UserModel, CreateUserDto, UpdateUserDto>(UserModel);
  private addressRepo = new BaseRepository<AddressModel, CreateAddressDto, any>(AddressModel);
  private contactRepo =
    new BaseRepository<ContactModel, CreateContactDto, UpdateContactDto>(ContactModel);
  private fetches = "[contact,addresses]";

  async get(ctx: IReqCtx, id: number): Promise<UserDto> {
    const user = await this.userRepo.get(id, this.fetches);
    if (!user) {
      throw new HttpException(404, `User ${id} does not exist`, ErrorCodes.INVALID_USER, { id });
    }

    return user;
  }

  async create(ctx: IReqCtx, data: CreateUserDto): Promise<UserDto> {
    this.logger.debug(`Creating user ${data.username}`, { data, ctx });
    return this.userRepo.create(data);
  }

  async createBulk(ctx: IReqCtx, data: CreateUserDto[]): Promise<UserDto[]> {
    this.logger.debug(`Creating ${data.length} users`, { data, ctx });
    return this.userRepo.createBulk(data);
  }

  async list(ctx: IReqCtx, query: Query): Promise<UserDto[]> {
    return this.userRepo.list(query, this.fetches);
  }

  async update(ctx: IReqCtx, id: number, data: UpdateUserDto): Promise<UserDto> {
    this.logger.debug(`Updating user ${id}`, { data, ctx });
    await this.contactRepo.query()
      .patch({ email: data.contact.email })
      .where("user_id", "=", id);
    return this.userRepo.updateById(id, data, this.fetches);
  }

  async delete(ctx: IReqCtx, id: number): Promise<number> {
    this.logger.debug(`Deleting user ${id}`, { data: { id }, ctx });
    return this.userRepo.deleteById(id);
  }

  async createAddress(ctx: IReqCtx, id: number, data: CreateAddressDto): Promise<AddressDto> {
    this.logger.debug(`Creating address for user ${id}`, { data, ctx });

    const user = await this.get(ctx, id);
    data.userId = user.id;

    return this.addressRepo.create(data);
  }
}
