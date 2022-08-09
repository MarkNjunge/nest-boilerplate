import { ApiProperty } from "@nestjs/swagger";
import { AddressDto } from "../address";
import { Type } from "class-transformer";
import { DTO } from "@/modules/_base/dto";
import { UserEntity } from "./user.entity";
import { IsNotEmpty, ValidateNested } from "class-validator";
import { ContactDto, CreateContactDto, ContactEntity, UpdateContactDto } from "../contact";

export class UserDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  username: string;

  @ApiProperty()
  contact: ContactDto;

  @ApiProperty({ type: AddressDto, isArray: true })
  @Type(() => AddressDto)
  addresses: AddressDto[];
}

export class CreateUserDto implements DTO<UserEntity> {
  @IsNotEmpty()
  @ApiProperty()
  username: string;

  @IsNotEmpty()
  @ApiProperty()
  @ValidateNested({ each: true })
  @Type(() => CreateContactDto)
  contact: CreateContactDto;

  toInstance(): UserEntity {
    const user = new UserEntity();
    user.username = this.username;
    user.contact = ContactEntity.fromCreateDto(this.contact);

    return user;
  }
}

export class UpdateUserDto implements DTO<UserEntity> {
  @ApiProperty()
  @IsNotEmpty()
  username: string;

  @ApiProperty()
  @IsNotEmpty()
  contact: UpdateContactDto;

  toInstance(): UserEntity {
    const user = new UserEntity();
    user.username = this.username;
    user.contact = ContactEntity.fromUpdateDto(this.contact);

    return user;
  }
}
