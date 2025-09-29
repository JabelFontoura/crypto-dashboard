import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import {
  AllExceptionsFilter,
  HttpExceptionFilter,
  DatabaseExceptionFilter,
} from './shared/filters';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const port = parseInt(process.env.PORT || '3001', 10);
  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';

  app.useGlobalFilters(new DatabaseExceptionFilter());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalFilters(new AllExceptionsFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    })
  );

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  await app.listen(port);
  console.log(
    `🚀 Crypto Dashboard Backend running on http://localhost:${port}`
  );
  console.log(`📊 Dashboard available at ${corsOrigin}`);
  console.log('💾 Using SQLite database with Sequelize ORM');
  console.log('⚙️  Configure your Finnhub API key through the Settings UI');
  console.log('   Get your free API key at: https://finnhub.io/register');

  process.on('SIGINT', async () => {
    console.log('🔄 Shutting down gracefully...');
    await app.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('🔄 Shutting down gracefully...');
    await app.close();
    process.exit(0);
  });
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start the application:', error);
  process.exit(1);
});
