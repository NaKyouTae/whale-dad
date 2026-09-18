import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient } from "@supabase/supabase-js";

/** createClient 가 실제로 돌려주는 제네릭 인스턴스 타입 */
type ServerSupabaseClient = ReturnType<typeof createClient>;

/**
 * Supabase Storage / Admin API 접근용 서버 클라이언트.
 * service_role 키를 사용하므로 절대 프론트로 노출하지 않는다.
 *
 * Storage 를 쓰지 않는 기능(예: 여두목 보스)만 돌릴 때도 서버가 떠야 하므로
 * 설정이 없으면 부팅을 막지 않고, 실제로 쓰려는 순간에만 실패시킨다.
 */
@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private client: ServerSupabaseClient | null = null;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    const url = this.config.get<string>("SUPABASE_URL");
    const key = this.config.get<string>("SUPABASE_SERVICE_ROLE_KEY");
    this.bucket = this.config.get<string>("SUPABASE_STORAGE_BUCKET") || "whale-dad";

    if (url && key) {
      this.client = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
    } else {
      this.logger.warn(
        "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 가 없어 Storage 기능이 비활성화됩니다.",
      );
    }
  }

  /** Storage 를 쓸 수 있는 상태인지 */
  get isEnabled(): boolean {
    return this.client !== null;
  }

  getClient(): ServerSupabaseClient {
    if (!this.client) {
      throw new ServiceUnavailableException(
        "Supabase 가 설정되지 않았습니다. SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 를 채워주세요.",
      );
    }
    return this.client;
  }

  /** 파일 업로드 후 public URL 반환 */
  async upload(path: string, file: Buffer, contentType: string): Promise<string> {
    const { error } = await this.getClient()
      .storage.from(this.bucket)
      .upload(path, file, { contentType, upsert: true });

    if (error) {
      this.logger.error(`Storage upload failed: ${path}`, error.message);
      throw error;
    }

    return this.getPublicUrl(path);
  }

  getPublicUrl(path: string): string {
    return this.getClient().storage.from(this.bucket).getPublicUrl(path).data.publicUrl;
  }

  async remove(paths: string[]): Promise<void> {
    const { error } = await this.getClient().storage.from(this.bucket).remove(paths);
    if (error) throw error;
  }
}
