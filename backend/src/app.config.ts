import {
  BadRequestException,
  ValidationPipe,
  type INestApplication,
  type ValidationError,
} from '@nestjs/common';
import { ApiExceptionFilter } from './common/api-exception.filter';

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
