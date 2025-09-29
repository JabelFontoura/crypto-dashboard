import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { DatabaseError } from 'sequelize';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, message, error } = this.getErrorDetails(exception);

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      error,
    };

    // Log the error with appropriate level
    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} - ${status} - ${message}`,
        exception instanceof Error ? exception.stack : exception
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.url} - ${status} - ${message}`
      );
    }

    response.status(status).json(errorResponse);
  }

  private getErrorDetails(exception: unknown): {
    status: number;
    message: string;
    error: string;
  } {
    // Handle HTTP exceptions (from NestJS)
    if (exception instanceof HttpException) {
      return {
        status: exception.getStatus(),
        message: exception.message,
        error: exception.name,
      };
    }

    // Handle Sequelize database errors
    if (this.isSequelizeError(exception)) {
      return this.handleSequelizeError(exception);
    }

    // Handle validation errors
    if (this.isValidationError(exception)) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Validation failed',
        error: 'ValidationError',
      };
    }

    // Handle generic errors
    if (exception instanceof Error) {
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: this.sanitizeErrorMessage(exception.message),
        error: exception.name || 'InternalServerError',
      };
    }

    // Handle unknown exceptions
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred',
      error: 'UnknownError',
    };
  }

  private isSequelizeError(exception: unknown): exception is DatabaseError {
    return (
      exception instanceof Error &&
      (exception.name === 'SequelizeDatabaseError' ||
        exception.name === 'SequelizeValidationError' ||
        exception.name === 'SequelizeUniqueConstraintError' ||
        exception.name === 'SequelizeForeignKeyConstraintError')
    );
  }

  private handleSequelizeError(error: DatabaseError): {
    status: number;
    message: string;
    error: string;
  } {
    // Handle specific SQLite errors
    if (error.message.includes('no such table')) {
      return {
        status: HttpStatus.SERVICE_UNAVAILABLE,
        message: 'Database is initializing. Please try again in a moment.',
        error: 'DatabaseInitializing',
      };
    }

    if (error.message.includes('UNIQUE constraint failed')) {
      return {
        status: HttpStatus.CONFLICT,
        message: 'A record with this data already exists',
        error: 'DuplicateRecord',
      };
    }

    if (error.message.includes('FOREIGN KEY constraint failed')) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Invalid reference to related data',
        error: 'InvalidReference',
      };
    }

    if (error.message.includes('NOT NULL constraint failed')) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Required field is missing',
        error: 'MissingRequiredField',
      };
    }

    // Generic database error
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Database operation failed',
      error: 'DatabaseError',
    };
  }

  private isValidationError(exception: unknown): boolean {
    return (
      exception instanceof Error &&
      (exception.name === 'ValidationError' ||
        exception.message.includes('validation') ||
        exception.message.includes('must be'))
    );
  }

  private sanitizeErrorMessage(message: string): string {
    // Remove sensitive information from error messages
    return message
      .replace(/password/gi, '[REDACTED]')
      .replace(/token/gi, '[REDACTED]')
      .replace(/key/gi, '[REDACTED]')
      .replace(/secret/gi, '[REDACTED]');
  }
}
