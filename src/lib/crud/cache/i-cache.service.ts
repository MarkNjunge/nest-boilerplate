export interface ICacheService {
  set(key: string, value: string | number, ttlS?: number): Promise<boolean>;
  get(key: string): Promise<string | null>;
  del(key: string): Promise<void>;
  setJSON(key: string, value: any, ttlS?: number): Promise<boolean>;
  getJSON<T>(key: string): Promise<T | null>;
  incr(key: string): Promise<number>;
}
