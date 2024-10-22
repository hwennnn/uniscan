import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidUnknownValues: false }),
  );

  app.setGlobalPrefix('/api/v1');
  await app.init();

  await app.listen(process.env.SERVER_PORT ?? 8000);
}
bootstrap();
