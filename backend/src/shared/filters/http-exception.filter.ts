import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // Extract message from different response formats
    const message = this.extractMessage(exceptionResponse);

    const errorResponse = {
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      ...(typeof exceptionResponse === 'object' && exceptionResponse !== null
        ? { details: exceptionResponse }
        : {}),
    };

    // Log based on status code
    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} - ${status} - ${message}`,
        exception.stack
      );
    } else if (status >= 400) {
      this.logger.warn(
        `${request.method} ${request.url} - ${status} - ${message}`
      );
    }

    response.status(status).json(errorResponse);
  }

  private extractMessage(exceptionResponse: string | object): string {
    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const response = exceptionResponse as any;

      // Handle validation error format
      if (Array.isArray(response.message)) {
        return response.message.join(', ');
      }

      // Handle standard error format
      if (response.message) {
        return response.message;
      }

      // Handle error with error field
      if (response.error) {
        return response.error;
      }
    }

    return 'An error occurred';
  }
}
