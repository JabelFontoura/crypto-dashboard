import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { CryptoController } from './controllers/crypto.controller';
import { CryptoDataService } from './services/crypto-data.service';
import { FinnhubWebSocketService } from './services/finnhub-websocket.service';
import { CryptoRepository } from './repositories/crypto.repository';
import appConfig from '../../shared/config/app.config';
import { CryptoPair } from './models/crypto-pair.model';
import { HourlyAverage } from './models/hourly-average.model';

@Module({
  imports: [
    ConfigModule.forFeature(appConfig),
    SequelizeModule.forFeature([CryptoPair, HourlyAverage]),
  ],
  controllers: [CryptoController],
  providers: [
    CryptoRepository,
    {
      provide: 'ICryptoRepository',
      useExisting: CryptoRepository,
    },
    CryptoDataService,
    {
      provide: 'ICryptoService',
      useExisting: CryptoDataService,
    },
    FinnhubWebSocketService,
    {
      provide: 'ICryptoWebSocketService',
      useExisting: FinnhubWebSocketService,
    },
  ],
  exports: ['ICryptoService', 'ICryptoWebSocketService'],
})
export class CryptoModule {}
