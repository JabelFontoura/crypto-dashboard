import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './modules/database/database.module';
import { CryptoModule } from './modules/crypto/crypto.module';
import { WebSocketModule } from './modules/websocket/websocket.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    CryptoModule,
    WebSocketModule,
  ],
})
export class AppModule {}
