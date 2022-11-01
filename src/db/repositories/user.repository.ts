/* eslint-disable max-len */
import { BaseRepository } from "@/db/base.repository";
import { UserModel } from "@/models/user/user.model";
import { CreateUserDto, UpdateUserDto } from "@/models/user";

export type UserRepository = BaseRepository<UserModel, CreateUserDto, UpdateUserDto>;
export const userRepository = new BaseRepository<UserModel, CreateUserDto, UpdateUserDto>(UserModel);
export const USER_REPOSITORY = "USER_REPOSITORY";

/**
 * How to create a custom repository implementation
 */
// export class UserRepository extends BaseRepository<UserModel, CreateUserDto, UpdateUserDto> {
//   constructor() {
//     super(UserModel);
//   }
// }
// export const userRepository = new UserRepository();
