import { FilterOp, filterOpArr } from "@/lib/crud/query/query.type";
import { registerDecorator, ValidationArguments, ValidationOptions } from "class-validator";

export function IsValidFilter(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: "isValidFilter",
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: string, args: ValidationArguments) {
          return validateFilter(value);
        },
        defaultMessage(validationArguments?: ValidationArguments): string {
          return `${propertyName} must match '(key,operand,value)'`;
        }
      }
    });
  };
}

export function validateFilter(s: string): boolean {
  if (s.length === 0) {
    return true;
  }

  const matches = s.match(/\([^)]+\)/g);

  // If no matches found, the filter is invalid
  if (!matches) {
    return false;
  }

  // Reconstruct the string from matches and check if it equals the original
  // This ensures no incomplete or extra characters exist
  const reconstructed = matches.join(":");
  if (reconstructed !== s) {
    return false;
  }

  return matches.every(s => {
    const { 0: key, 1: op, 2: value, 3: secondValue } = s.slice(1, -1).split(",");
    return s.startsWith("(") && s.endsWith(")") && filterOpArr.includes(op as FilterOp);
  });
}

export function IsValidSort(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: "isValidSort",
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: string, args: ValidationArguments) {
          return validateSort(value);
        },
        defaultMessage(validationArguments?: ValidationArguments): string {
          return `${propertyName} must match '(key.subkey,direction)'`;
        }
      }
    });
  };
}

export function validateSort(s: string): boolean {
  if (s.length === 0) {
    return true;
  }

  return s.split(":").every(s => {
    const { 0: key, 1: direction } = s.slice(1, -1).split(",");
    return s.startsWith("(") && s.endsWith(")") && ["ASC", "DESC"].includes(direction) && key?.length > 0;
  });
}
