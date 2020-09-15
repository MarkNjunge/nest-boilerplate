import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from "@nestjs/common";
import { validate } from "class-validator";
import { plainToClass } from "class-transformer";
import { config } from "./../Config";
import { ErrorCodes } from "../error-codes";

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    // Account for an empty request body
    if (value == null) {
      value = {};
    }

    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToClass(metatype, value);
    const errors = await validate(object, {
      forbidUnknownValues: config.validator.forbidUnknown,
      whitelist: config.validator.forbidUnknown,
      forbidNonWhitelisted: config.validator.forbidUnknown,
    });

    if (errors.length == 0) {
      return value;
    }

    // Top-level errors
    const topLevelErrors = errors
      .filter((v) => v.constraints) // Top-level errors have the constraints here
      .map((error) => {
        return {
          property: error.property,
          constraints: Object.values(error.constraints),
        };
      });

    // Nested errors
    const nestedErrors = [];
    errors
      .filter((v) => !v.constraints) // Nested errors do not have constraints here
      .forEach((error) => {
        const validationErrors = this.getValidationErrorsFromChildren(
          error.property,
          error.children,
        );
        nestedErrors.push(...validationErrors);
      });

    const validationErrors = topLevelErrors.concat(nestedErrors);
    const errorProperties = validationErrors.map((e) => e.property).join(",");
    throw new BadRequestException({
      message: `Validation errors with properties [${errorProperties}]`,
      code: ErrorCodes.VALIDATION_ERROR,
      meta: validationErrors,
    });
  }

  private toValidate(metatype: any): boolean {
    const types: Array<() => any> = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  private getValidationErrorsFromChildren(parent, children, errors = []) {
    children.forEach((child) => {
      if (child.constraints) {
        errors.push({
          property: `${parent}.${child.property}`,
          constraints: Object.values(child.constraints),
        });
      } else {
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
