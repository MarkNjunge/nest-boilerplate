import { IsNotEmpty, ValidateNested } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { CreateContactDto } from "./CreateContactDto";
import { Type } from "class-transformer";
import { UserEntity } from "../../../db/entity/User.entity";
import { ContactEntity } from "../../../db/entity/Contact.entity";
import { DTO } from "../../_base/dto";

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
