import { Module } from "@nestjs/common";
import { BossChannelsController } from "./boss-channels.controller";
import { BossChannelsService } from "./boss-channels.service";

@Module({
  controllers: [BossChannelsController],
  providers: [BossChannelsService],
})
export class BossChannelsModule {}
