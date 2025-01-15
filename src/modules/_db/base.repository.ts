/* eslint-disable @typescript-eslint/require-await */
import { ModelClass, QueryBuilderType, TransactionOrKnex } from "objection";
import { BaseModel } from "@/models/_base.model";
import { applyQuery, Query } from "@/utils";

/**
 * How to create a custom repository implementation
 */
// export class UserRepository extends BaseRepository<UserModel, CreateUserDto, UpdateUserDto> {
//   constructor() {
//     super(UserModel);
//   }
// }
// export const userRepository = new UserRepository();

export class BaseRepository<Model extends BaseModel, CreateDto, UpdateDto> {
  constructor(protected readonly model: ModelClass<Model>) {}

  query(trxOrKnex?: TransactionOrKnex): QueryBuilderType<Model> {
    return this.model.query(trxOrKnex);
  }

  async get(id: number, fetches = ""): Promise<Model | null> {
    return this.model
      .query()
      .findById(id)
      .withGraphJoined(fetches) as unknown as Model;
  }

  async list(query: Query, fetches = ""): Promise<Model[]> {
    return applyQuery(query, this.model.query()).withGraphJoined(
      fetches,
    ) as unknown as Model[];
  }

  async create(data: CreateDto, trxOrKnex?: TransactionOrKnex): Promise<Model> {
    // @ts-expect-error Type instantiation is excessively deep and possibly infinite.
    return this.model
      .query(trxOrKnex)
      .insertGraph(data as any)
      .returning("*") as Model;
  }

  async createBulk(
    data: CreateDto[],
    trxOrKnex?: TransactionOrKnex,
  ): Promise<Model[]> {
    // @ts-expect-error Type instantiation is excessively deep and possibly infinite.
    return this.model
      .query(trxOrKnex)
      .insertGraph(data as any)
      .returning("*") as Model;
  }

  async updateById(
    id: number,
    data: UpdateDto,
    fetches = "",
    trxOrKnex?: TransactionOrKnex,
  ): Promise<Model> {
    return this.model
      .query(trxOrKnex)
      .patchAndFetchById(id, data as any)
      .withGraphJoined(fetches) as unknown as Model;
  }

  async deleteById(id: number): Promise<number> {
    return this.model.query().deleteById(id) as any;
  }
}
