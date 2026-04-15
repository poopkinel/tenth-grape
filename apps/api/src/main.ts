import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { APP_NAME } from '@meeple/shared';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );
  app.enableCors({ origin: true, credentials: true });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`${APP_NAME} API running on http://localhost:${port}/api`);
}
bootstrap();
