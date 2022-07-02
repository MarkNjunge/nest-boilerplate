import { ApiProperty } from "@nestjs/swagger";
import { UpdateContactDto } from "./UpdateContact.dto";
import { IsNotEmpty } from "class-validator";
import { DTO } from "../../_base/dto";
import { UserEntity } from "../../../db/entity/User.entity";
import { ContactEntity } from "../../../db/entity/Contact.entity";

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
