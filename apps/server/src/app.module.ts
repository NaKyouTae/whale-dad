import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { SupabaseModule } from "./supabase/supabase.module";
import { HealthModule } from "./health/health.module";
import { BossChannelsModule } from "./boss-channels/boss-channels.module";
import { AuthModule } from "./auth/auth.module";
import { validateEnv } from "./config/env.validation";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
    }),
    PrismaModule,
    SupabaseModule,
    HealthModule,
    AuthModule,
    BossChannelsModule,
  ],
})
export class AppModule {}
