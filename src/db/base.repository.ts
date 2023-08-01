import { ModelClass, QueryBuilderType, TransactionOrKnex } from "objection";
import { BaseModel } from "@/models/_base.model";
import { applyQuery, Query } from "@/utils";

export class BaseRepository<Model extends BaseModel, CreateDto, UpdateDto> {
  constructor(
    protected readonly model: ModelClass<Model>,
  ) {
  }

  query(
    trxOrKnex?: TransactionOrKnex
  ): QueryBuilderType<Model> {
    return this.model.query(trxOrKnex);
  }

  async get(
    id: number,
    fetches = "",
  ): Promise<Model> {
    return await this.model.query()
      .findById(id)
      .withGraphJoined(fetches) as Model;
  }

  async list(
    query: Query,
    fetches = "",
  ): Promise<Model[]> {
    return await applyQuery(query, this.model.query())
      .withGraphJoined(fetches) as Model[];
  }

  async create(
    data: CreateDto,
    trxOrKnex?: TransactionOrKnex,
  ): Promise<Model> {
    // @ts-expect-error Type instantiation is excessively deep and possibly infinite.
    return await this.model.query(trxOrKnex)
      .insertGraph(data as any)
      .returning("*") as Model;
  }

  async createBulk(
    data: CreateDto[],
    trxOrKnex?: TransactionOrKnex,
  ): Promise<Model[]> {
    // @ts-expect-error Type instantiation is excessively deep and possibly infinite.
    return await this.model.query(trxOrKnex)
      .insertGraph(data as any)
      .returning("*") as Model;
  }

  // eslint-disable-next-line max-params
  async updateById(
    id: number,
    data: UpdateDto,
    fetches = "",
    trxOrKnex?: TransactionOrKnex,
  ): Promise<Model> {
    return await this.model.query(trxOrKnex)
      .patchAndFetchById(id, data as any)
      .withGraphJoined(fetches) as Model;
  }

  async deleteById(
    id: number,
  ): Promise<number> {
    return this.model.query().deleteById(id) as any;
  }
}
