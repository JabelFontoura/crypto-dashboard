import { Logger } from '@nestjs/common';

export class AppLogger extends Logger {
  error(message: string, trace?: string, context?: string): void {
    super.error(`❌ ${message}`, trace, context || this.context);
  }

  warn(message: string, context?: string): void {
    super.warn(`⚠️  ${message}`, context || this.context);
  }

  log(message: string, context?: string): void {
    super.log(`ℹ️  ${message}`, context || this.context);
  }

  debug(message: string, context?: string): void {
    super.debug(`🐛 ${message}`, context || this.context);
  }

  verbose(message: string, context?: string): void {
    super.verbose(`📝 ${message}`, context || this.context);
  }
}
