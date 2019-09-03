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
    if (value == null) {
      value = {};
    }

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
      // Top-level errors
      const topLevelErrors = errors
        .filter(v => v.constraints)
        .map(error => {
          return {
            property: error.property,
            constraints: Object.values(error.constraints),
          };
        });

      // Nested errors
      const nestedErrors = [];
      errors
        .filter(v => !v.constraints)
        .forEach(error => {
          const validationErrors = this.getValidationErrorsFromChildren(
            error.property,
            error.children,
          );
          nestedErrors.push(...validationErrors);
        });

      throw new BadRequestException({
        message: "Validation failed",
        meta: topLevelErrors.concat(nestedErrors),
      });
    }

    return value;
  }

  private toValidate(metatype: any): boolean {
    const types: Array<() => any> = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  private getValidationErrorsFromChildren(parent, children, errors = []) {
    children.forEach(child => {
      if (child.constraints) {
        errors.push({
          property: `${parent}.${child.property}`,
          constraints: Object.values(child.constraints),
        });
      } else {
        // TODO
        return this.getValidationErrorsFromChildren(
          `${parent}.${child.property}`,
          child.children,
          errors,
        );
      }
    });

    return errors;
  }
}
