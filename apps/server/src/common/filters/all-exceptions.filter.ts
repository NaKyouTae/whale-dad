import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { Request, Response } from "express";
import type { ApiErrorResponse } from "@whale-dad/shared";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status: number =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = this.resolveMessage(exception);

    // 5xx 만 스택과 함께 로깅. 4xx 는 클라이언트 잘못이므로 조용히 넘긴다.
    if (status >= 500) {
      this.logger.error(`${request.method} ${request.originalUrl} — ${message}`, exception);
    }

    const body: ApiErrorResponse = {
      success: false,
      statusCode: status,
      message,
      path: request.originalUrl,
      timestamp: new Date().toISOString(),
    };

    response.status(status).json(body);
  }

  private resolveMessage(exception: unknown): string {
    if (exception instanceof HttpException) {
      const res: string | object = exception.getResponse();

      if (typeof res === "string") return res;

      if ("message" in res) {
        const { message } = res;
        // ValidationPipe 는 message 를 string[] 로 내려준다.
        if (Array.isArray(message)) return message.map(String).join(", ");
        if (typeof message === "string") return message;
      }

      return exception.message;
    }

    return exception instanceof Error ? exception.message : "Internal server error";
  }
}
