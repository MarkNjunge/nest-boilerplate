import { IReqCtx } from "@/decorators/request-context.decorator";

export interface ICrudService<DTO, CreateDTO, UpdateDTO> {
  get(ctx: IReqCtx, id: number): Promise<DTO | null>;

  list(ctx: IReqCtx): Promise<DTO[]>;

  create(ctx: IReqCtx, dto: CreateDTO): Promise<DTO>;

  createBulk(ctx: IReqCtx, dtos: CreateDTO[]): Promise<DTO[]>;

  update(ctx: IReqCtx, id: number, dto: UpdateDTO): Promise<DTO>;

  delete(ctx: IReqCtx, id: number);
}
