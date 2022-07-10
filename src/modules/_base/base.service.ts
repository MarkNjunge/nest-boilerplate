import { Repository } from "typeorm";
import { ResponseUtils } from "../../utils/ResponseUtils";
import { ClassConstructor, plainToInstance } from "class-transformer";
import { ICrudService } from "./crud.service";
import { DTO } from "./dto";
import { HttpException } from "../../utils/HttpException";
import { ErrorCodes } from "../../utils/error-codes";
import { IReqCtx } from "../../decorators/request-context.decorator";

// eslint-disable-next-line max-len
export class BaseService<Entity, ClassDTO, CreateDTO extends DTO<Entity>, UpdateDTO extends DTO<Entity>>
  implements ICrudService<ClassDTO, CreateDTO, UpdateDTO> {

  constructor(
    protected readonly clz: ClassConstructor<ClassDTO>,
    protected readonly createClz: ClassConstructor<CreateDTO>,
    protected readonly updateClz: ClassConstructor<UpdateDTO>,
    protected readonly repo: Repository<Entity>,
  ) {}

  async get(ctx: IReqCtx, id: number): Promise<ClassDTO | null> {
    const item = await this.repo.findOne(id);
    if (!item) {
      return null;
    }

    return ResponseUtils.cleanObject(this.clz, item);
  }

  async list(ctx: IReqCtx): Promise<ClassDTO[]> {
    const items = await this.repo.find();
    return ResponseUtils.cleanObjectArr(this.clz, items);
  }

  async create(ctx: IReqCtx, dto: CreateDTO): Promise<ClassDTO> {
    dto = plainToInstance(this.createClz, dto);
    const entity = dto.toInstance();
    const item = await this.repo.save(entity);

    return ResponseUtils.cleanObject(this.clz, item);
  }

  async createBulk(ctx: IReqCtx, dtos: CreateDTO[]): Promise<ClassDTO[]> {
    const entities = dtos.map(dto => {
      dto = plainToInstance(this.createClz, dto);
      return dto.toInstance();
    });
    const items = await this.repo.save(entities);
    return ResponseUtils.cleanObjectArr(this.clz, items);
  }

  async update(ctx: IReqCtx, id: number, dto: UpdateDTO): Promise<ClassDTO> {
    dto = plainToInstance(this.updateClz, dto);
    // Workaround method: https://github.com/typeorm/typeorm/issues/4477#issuecomment-579142518
    let item = await this.repo.findOne(id);
    if (item == null) {
      throw new HttpException(404, `The ${id} does not exist`, ErrorCodes.INVALID_USER);
    }

    const entity = dto.toInstance();
    this.repo.merge(item, entity);
    item = await this.repo.save(item);

    return ResponseUtils.cleanObject(this.clz, item);
  }

  async delete(ctx: IReqCtx, id: number) {
    await this.repo.delete(id);
  }

}
