import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CryptoWebSocketGateway } from './gateways/crypto-websocket.gateway';
import { CryptoModule } from '../crypto/crypto.module';
import appConfig from '../../shared/config/app.config';

@Module({
  imports: [ConfigModule.forFeature(appConfig), CryptoModule],
  providers: [CryptoWebSocketGateway],
  exports: [CryptoWebSocketGateway],
})
export class WebSocketModule {}
