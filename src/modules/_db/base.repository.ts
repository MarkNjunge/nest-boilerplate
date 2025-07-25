/* eslint-disable @typescript-eslint/require-await */
import { ModelClass, QueryBuilderType, TransactionOrKnex } from "objection";
import { BaseModel } from "@/models/_base.model";
import { applyQuery, blankQuery, Query } from "@/utils";

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

  async count(query: Query = blankQuery()): Promise<number> {
    const r = (await applyQuery(query, this.model.query()).count()) as any as { count: string }[];
    return parseInt(r[0].count) as any;
  }

  async get(id: number, joins = ""): Promise<Model | null> {
    return this.model
      .query()
      .findById(id)
      .withGraphJoined(joins) as unknown as Model;
  }

  async list(query: Query = blankQuery(), joins = ""): Promise<Model[]> {
    return applyQuery(query, this.model.query()).withGraphJoined(
      joins,
    ) as unknown as Model[];
  }

  async create(data: CreateDto, trxOrKnex?: TransactionOrKnex): Promise<Model> {
    return this.model
      .query(trxOrKnex)
      .insertGraph(data as any)
      .returning("*") as any;
  }

  async createBulk(
    data: CreateDto[],
    trxOrKnex?: TransactionOrKnex,
  ): Promise<Model[]> {
    return this.model
      .query(trxOrKnex)
      .insertGraph(data as any)
      .returning("*") as any;
  }

  async updateById(
    id: number,
    data: UpdateDto,
    joins = "",
    trxOrKnex?: TransactionOrKnex,
  ): Promise<Model> {
    return this.model
      .query(trxOrKnex)
      .patchAndFetchById(id, data as any)
      .withGraphJoined(joins) as any;
  }

  async deleteById(id: number): Promise<number> {
    return this.model.query().deleteById(id) as any;
  }
}
