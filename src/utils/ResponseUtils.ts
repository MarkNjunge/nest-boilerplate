import { ClassConstructor, plainToInstance } from "class-transformer";

export class ResponseUtils {
  /**
   * Excludes parameters without an `@Expose()` decorator from the object
   * @param clz Desired response class
   * @param data Object
   */
  static cleanObject<T>(clz: ClassConstructor<T>, data: any): T {
    return plainToInstance(clz, data, {
      enableImplicitConversion: true,
    });
  }

  /**
   * Excludes parameters without an `@Expose()` decorator from the object
   * @param clz Desired response class
   * @param data Object
   */
  static cleanObjectArr<T>(clz: ClassConstructor<T>, data: any[]): T[] {
    return data.map(d => this.cleanObject(clz, d));
  }
}
