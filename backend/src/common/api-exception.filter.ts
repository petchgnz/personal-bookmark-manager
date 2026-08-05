import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';

interface ApiErrorBody {
  statusCode: number;
  code: string;
  message: string;
  details?: unknown;
}

const defaultCodes: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'VALIDATION_ERROR',
  [HttpStatus.UNAUTHORIZED]: 'UNAUTHENTICATED',
  [HttpStatus.NOT_FOUND]: 'RESOURCE_NOT_FOUND',
  [HttpStatus.CONFLICT]: 'RESOURCE_CONFLICT',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'INTERNAL_ERROR',
};

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const isHttpException = exception instanceof HttpException;
    const statusCode = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse = isHttpException ? exception.getResponse() : null;
    const safeResponse =
      typeof exceptionResponse === 'object' && exceptionResponse !== null
        ? (exceptionResponse as Record<string, unknown>)
        : {};
    const fallbackMessage =
      statusCode === 500
        ? 'Internal server error'
        : typeof exceptionResponse === 'string'
          ? exceptionResponse
          : 'Request failed';
    const body: ApiErrorBody = {
      statusCode,
      code:
        typeof safeResponse.code === 'string'
          ? safeResponse.code
          : (defaultCodes[statusCode] ?? 'HTTP_ERROR'),
      message:
        typeof safeResponse.message === 'string'
          ? safeResponse.message
          : fallbackMessage,
    };

    if (Array.isArray(safeResponse.details)) {
      body.details = safeResponse.details;
    }

    response.status(statusCode).json(body);
  }
}
