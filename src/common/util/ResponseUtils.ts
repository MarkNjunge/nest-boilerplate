import { ClassType } from "class-transformer/ClassTransformer";
import { plainToClass } from "class-transformer";

export class ResponseUtils {
  /**
   * Excludes parameters without an `@Expose()` decorator from the object
   * @param clz Desired response class
   * @param data Object
   */
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  static cleanObject<T>(clz: ClassType<T>, data: any): T {
    return plainToClass(clz, data, {
      excludeExtraneousValues: true,
    });
  }
}
