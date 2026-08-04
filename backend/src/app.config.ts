import {
  BadRequestException,
  ValidationPipe,
  type INestApplication,
  type ValidationError,
} from '@nestjs/common';
import type { CustomOrigin } from '@nestjs/common/interfaces/external/cors-options.interface';
import { ApiExceptionFilter } from './common/api-exception.filter';
import { ConfigService } from '@nestjs/config';

function flattenValidationErrors(
  errors: ValidationError[],
  parent = '',
): Array<{ field: string; issue: string }> {
  return errors.flatMap((error) => {
    const field = parent ? `${parent}.${error.property}` : error.property;
    const ownIssues = Object.values(error.constraints ?? {}).map((issue) => ({
      field,
      issue,
    }));

    return [
      ...ownIssues,
      ...flattenValidationErrors(error.children ?? [], field),
    ];
  });
}

export function configureApp(app: INestApplication): void {
  const configService = app.get(ConfigService);
  const frontendOrigin =
    configService.get<string>('FRONTEND_ORIGIN') ?? 'http://localhost:3000';
  const allowFrontendOrigin: CustomOrigin = (requestOrigin, callback) =>
    callback(
      null,
      requestOrigin === undefined || requestOrigin === frontendOrigin,
    );
  app.enableCors({
    origin: allowFrontendOrigin,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type'],
  });
  app.enableShutdownHooks();
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) =>
        new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: flattenValidationErrors(errors),
        }),
    }),
  );
  app.useGlobalFilters(new ApiExceptionFilter());
}
