import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { DatabaseError } from 'sequelize';

@Catch(DatabaseError)
export class DatabaseExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DatabaseExceptionFilter.name);

  catch(exception: DatabaseError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, message, error } = this.handleDatabaseError(exception);

    const errorResponse = {
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      error,
    };

    // Log database errors appropriately
    if (this.isTableNotExistError(exception)) {
      this.logger.debug(
        `Database table not ready: ${request.method} ${request.url} - ${message}`
      );
    } else {
      this.logger.error(
        `Database error: ${request.method} ${request.url} - ${status} - ${message}`,
        exception.stack
      );
    }

    response.status(status).json(errorResponse);
  }

  private handleDatabaseError(error: DatabaseError): {
    status: number;
    message: string;
    error: string;
  } {
    // Handle table doesn't exist (common during initialization)
    if (this.isTableNotExistError(error)) {
      return {
        status: HttpStatus.SERVICE_UNAVAILABLE,
        message:
          'Database is initializing. Tables will be created when data is first received.',
        error: 'DatabaseInitializing',
      };
    }

    // Handle unique constraint violations
    if (error.message.includes('UNIQUE constraint failed')) {
      return {
        status: HttpStatus.CONFLICT,
        message: 'A record with this data already exists',
        error: 'DuplicateRecord',
      };
    }

    // Handle foreign key constraint violations
    if (error.message.includes('FOREIGN KEY constraint failed')) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Invalid reference to related data',
        error: 'InvalidReference',
      };
    }

    // Handle NOT NULL constraint violations
    if (error.message.includes('NOT NULL constraint failed')) {
      const field = this.extractFieldFromError(error.message);
      return {
        status: HttpStatus.BAD_REQUEST,
        message: field
          ? `Required field '${field}' is missing`
          : 'Required field is missing',
        error: 'MissingRequiredField',
      };
    }

    // Handle data type errors
    if (
      error.message.includes('datatype mismatch') ||
      error.message.includes('invalid input')
    ) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Invalid data format provided',
        error: 'InvalidDataFormat',
      };
    }

    // Handle database connection errors
    if (
      error.message.includes('database is locked') ||
      error.message.includes('connection')
    ) {
      return {
        status: HttpStatus.SERVICE_UNAVAILABLE,
        message: 'Database is temporarily unavailable. Please try again.',
        error: 'DatabaseUnavailable',
      };
    }

    // Generic database error
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'A database error occurred',
      error: 'DatabaseError',
    };
  }

  private isTableNotExistError(error: DatabaseError): boolean {
    return (
      error.message.includes('no such table') ||
      (error.message.includes('table') &&
        error.message.includes('does not exist'))
    );
  }

  private extractFieldFromError(message: string): string | null {
    // Extract field name from "NOT NULL constraint failed: table.field"
    const match = message.match(/NOT NULL constraint failed: \w+\.(\w+)/);
    return match ? match[1] : null;
  }
}
