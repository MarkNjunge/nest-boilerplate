export interface ICrudService<DTO, CreateDTO, UpdateDTO> {
  get(id: number): Promise<DTO | null>;

  list(): Promise<DTO[]>;

  create(dto: CreateDTO): Promise<DTO>;

  createBulk(dtos: CreateDTO[]): Promise<DTO[]>;

  update(id: number, dto: UpdateDTO): Promise<DTO>;

  delete(id: number);
}
