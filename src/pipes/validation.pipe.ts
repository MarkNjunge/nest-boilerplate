/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from "@nestjs/common";
import { validate, ValidationError } from "class-validator";
import { plainToClass } from "class-transformer";
import { config } from "../config";
import { ErrorCodes } from "../utils/error-codes";

@Injectable()
export class ValidationPipe implements PipeTransform {
  // eslint-disable-next-line max-lines-per-function
  async transform<T>(value: T, { metatype }: ArgumentMetadata): Promise<T> {
    // Account for an empty request body
    if (value === null) {
      value = Object.assign({}, value);
    }

    if (!metatype || !ValidationPipe.toValidate(metatype)) {
      return value;
    }

    const object = plainToClass(metatype, value);
    const errors = await validate(object, {
      forbidUnknownValues: config.validator.forbidUnknown,
      whitelist: config.validator.forbidUnknown,
      forbidNonWhitelisted: config.validator.forbidUnknown,
    });

    if (errors.length === 0) {
      return value;
    }

    // Top-level errors
    const topLevelErrors: ValidationErrorDto[] = errors
      // Top-level errors have the constraints here
      .filter(v => v.constraints)
      .map(error => ({
        property: error.property,
        constraints: Object.values(error.constraints as any),
      }));

    // Nested errors
    const nestedErrors: ValidationErrorDto[] = [];
    errors
      // Nested errors do not have constraints here
      .filter(v => !v.constraints)
      .forEach(error => {
        const validationErrors = this.getValidationErrorsFromChildren(
          error.property,
          error.children,
        );
        nestedErrors.push(...validationErrors);
      });

    const validationErrors = topLevelErrors.concat(nestedErrors);
    const errorProperties = validationErrors.map(e => e.property).join(",");
    throw new BadRequestException({
      message: `Validation errors with properties [${errorProperties}]`,
      code: ErrorCodes.VALIDATION_ERROR,
      meta: validationErrors,
    });
  }

  private static toValidate(metatype: any): boolean {
    const types: Array<() => any> = [String, Boolean, Number, Array, Object];

    return !types.includes(metatype);
  }

  private getValidationErrorsFromChildren(
    parent: string,
    children: ValidationError[],
    errors: ValidationErrorDto[] = []
  ): ValidationErrorDto[] {
    children.forEach(child => {
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

interface ValidationErrorDto {
  property: string;
  constraints: string[];
}
