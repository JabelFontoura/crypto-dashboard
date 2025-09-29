import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import databaseConfig from '../../shared/config/database.config';
import { AppLogger } from '../../shared/utils/logger.util';

const logger = new AppLogger('DatabaseModule');

@Global()
@Module({
  imports: [
    ConfigModule.forFeature(databaseConfig),
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const config = configService.get('database');

        return {
          ...config,
          logging: (msg: string) => logger.debug(msg),
        };
      },
      inject: [ConfigService],
    }),
  ],
  exports: [SequelizeModule],
})
export class DatabaseModule {}
