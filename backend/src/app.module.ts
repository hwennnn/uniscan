import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { EthPriceModule } from './eth-price/eth-price.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { TransactionsModule } from './transactions/transactions.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    // Register BullMQ module with configuration
    BullModule.forRootAsync({
      imports: [ConfigModule], // Ensure ConfigModule is imported
      inject: [ConfigService], // Inject ConfigService
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'localhost'), // Fallback to 'localhost'
          port: parseInt(configService.get<string>('REDIS_PORT', '6379'), 10), // Fallback to '6379'
        },
      }),
    }),
    PrismaModule,
    RedisModule,
    EthPriceModule,
    TransactionsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
