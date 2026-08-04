import { HttpException, HttpStatus } from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import type { Response } from 'express';
import { ApiExceptionFilter } from './api-exception.filter';

describe('ApiExceptionFilter', () => {
  function createHost() {
    const json = jest.fn();
    const status = jest.fn(() => ({ json })) as unknown as Response['status'];
    const response = { status } as unknown as Response;
    const host = {
      switchToHttp: () => ({ getResponse: () => response }),
    } as ArgumentsHost;
    return { host, status, json };
  }

  it('does not expose unexpected error details', () => {
    const { host, status, json } = createHost();

    new ApiExceptionFilter().catch(
      new Error('DATABASE_URL=secret path=C:\\private\\app SQL SELECT *'),
      host,
    );

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    });
  });

  it('preserves only the safe structured HTTP error contract', () => {
    const { host, status, json } = createHost();
    const exception = new HttpException(
      {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: [{ field: 'name', issue: 'must not be empty' }],
      },
      HttpStatus.BAD_REQUEST,
    );

    new ApiExceptionFilter().catch(exception, host);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      details: [{ field: 'name', issue: 'must not be empty' }],
    });
  });
});
