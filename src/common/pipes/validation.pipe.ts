import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from "@nestjs/common";
import { validate } from "class-validator";
import { plainToClass } from "class-transformer";

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    if (value == null) {
      value = {};
    }

    const object = plainToClass(metatype, value);
    const errors = await validate(object, {
      forbidUnknownValues: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    if (errors.length > 0) {
      const meta = errors.map(error => {
        return {
          property: error.property,
          constraints: Object.values(error.constraints),
        };
      });

      throw new BadRequestException({ message: "Validation failed", meta });
    }
    return value;
  }

  private toValidate(metatype: any): boolean {
    const types: Array<() => any> = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
