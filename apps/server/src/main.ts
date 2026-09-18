import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { TransformInterceptor } from "./common/interceptors/transform.interceptor";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix("api");
  app.use(helmet());
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  const origins = (process.env.CORS_ORIGINS ?? "http://localhost:20001")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({ origin: origins, credentials: true });

  if (process.env.NODE_ENV !== "production") {
    const config = new DocumentBuilder()
      .setTitle("whale-dad API")
      .setDescription("고래 아빠를 위하여 — API 문서")
      .setVersion("0.1.0")
      .addCookieAuth("whale_dad_token")
      .build();
    SwaggerModule.setup("api/docs", app, SwaggerModule.createDocument(app, config));
  }

  const port = Number(process.env.PORT ?? 20000);
  await app.listen(port, "0.0.0.0");

  Logger.log(`🐋 whale-dad server listening on http://localhost:${port}/api`, "Bootstrap");
}

void bootstrap();
