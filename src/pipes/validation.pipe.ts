import { PipeTransform, Injectable, ArgumentMetadata } from "@nestjs/common";
import { validate, ValidationError } from "class-validator";
import { plainToInstance } from "class-transformer";
import { config } from "@/config";
import { ErrorCodes, HttpException } from "@/utils";

// https://github.com/nestjs/nest/blob/d295f1c572f64aa8239d3fab4cfa59df220c3ebb/packages/common/interfaces/type.interface.ts
export type Type<T = any> = new (...args: any[]) => T;

@Injectable()
export class ValidationPipe implements PipeTransform {
  async transform<T>(value: T, metadata: ArgumentMetadata): Promise<T> {
    const validationErrors = await ValidationPipe.validate(value, metadata);

    if (validationErrors.length === 0) {
      return value;
    }

    const errorProperties = validationErrors.map(e => e.property).join(",");
    throw new HttpException(
      400,
      `Validation errors with properties [${errorProperties}]`,
      ErrorCodes.VALIDATION_ERROR,
      validationErrors,
    );
  }

  static async validate(
    value: any,
    { metatype }: ArgumentMetadata,
  ): Promise<ValidationErrorDto[]> {
    // Account for an empty request body
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    if (value == null) {
      value = Object.assign({}, value);
    }

    if (!metatype || !ValidationPipe.toValidate(metatype)) {
      return [];
    }

    // Incorrect Content-Type header was set, resulting in the data not being parsed
    if (typeof value != "object") {
      throw new HttpException(400, "Invalid content type", ErrorCodes.CLIENT_ERROR);
    }

    if (Array.isArray(value)) {
      const out: ValidationErrorDto[] = [];
      for (let i = 0; i < value.length; i++) {
        const errors = await this.validateSingle(value[i], metatype);
        out.push(...errors.map(e => ({ property: `${i}.${e.property}`, constraints: e.constraints })));
      }

      return out;
    } else {
      return this.validateSingle(value, metatype);
    }
  }

  private static async validateSingle(value: any, metatype: Type): Promise<ValidationErrorDto[]> {
    const object = plainToInstance(metatype, value);
    const errors = await validate(object, {
      forbidUnknownValues: config.validator.forbidUnknown,
      whitelist: config.validator.forbidUnknown,
      forbidNonWhitelisted: config.validator.forbidUnknown,
    });

    if (errors.length === 0) {
      return [];
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
        if (error.children) {
          const validationErrors =
            ValidationPipe.getValidationErrorsFromChildren(
              error.property,
              error.children,
            );
          nestedErrors.push(...validationErrors);
        }
      });

    return topLevelErrors.concat(nestedErrors);
  }

  static toValidate(metatype: any): boolean {
    const types: (() => any)[] = [String, Boolean, Number, Array, Object];

    return !types.includes(metatype);
  }

  static getValidationErrorsFromChildren(
    parent: string,
    children: ValidationError[],
    errors: ValidationErrorDto[] = [],
  ): ValidationErrorDto[] {
    children.forEach(child => {
      if (child.constraints) {
        errors.push({
          property: `${parent}.${child.property}`,
          constraints: Object.values(child.constraints),
        });
      } else if (child.children) {
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

export interface ValidationErrorDto {
  property: string;
  constraints: string[];
}
