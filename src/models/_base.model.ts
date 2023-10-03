import { Model, snakeCaseMappers } from "objection";

export class BaseModel extends Model {
  id: number;

  static get modelPaths() {
    return [__dirname];
  }

  static get columnNameMappers() {
    return snakeCaseMappers();
  }
}
