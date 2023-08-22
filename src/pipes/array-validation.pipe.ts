import { ArgumentMetadata, Injectable, PipeTransform } from "@nestjs/common";
import { ValidationErrorDto, ValidationPipe } from "./validation.pipe";
import { HttpException, ErrorCodes } from "@/utils";

// https://github.com/nestjs/nest/blob/d295f1c572f64aa8239d3fab4cfa59df220c3ebb/packages/common/interfaces/type.interface.ts
export type Type<T = any> = new(...args: any[]) => T;

@Injectable()
export class ArrayValidationPipe implements PipeTransform {
  private readonly type: Type;

  constructor(type: Type) {
    this.type = type;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async transform<T>(value: T[] | null, metadata: ArgumentMetadata): Promise<T[]> {
    // Account for an empty request body
    if (value == null) {
      value = [];
    }

    const errors: ValidationErrorDto[] = [];
    for (const [i, valueElement] of value.entries()) {
      const validationErrors = await ValidationPipe.validate(valueElement, {
        metatype: this.type,
        type: "body",
      });

      const resMeta = validationErrors.map(m => ({ ...m, property: `${i}.${m.property}` }));
      errors.push(...resMeta);
    }

    if (errors.length === 0) {
      return value;
    }

    const errorProperties = errors.map(e => e.property).join(",");
    throw new HttpException(
      400,
      `Validation errors with properties [${errorProperties}]`,
      ErrorCodes.VALIDATION_ERROR,
      errors,
    );
  }
}
