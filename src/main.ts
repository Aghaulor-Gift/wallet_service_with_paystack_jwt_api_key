import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { setupSwagger } from './config/swagger.config';
import * as bodyParser from 'body-parser';
import { ValidationPipe, Logger } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  app.enableCors({
    origin: '*',
    allowedHeaders: 'Content-Type, Authorization, x-api-key',
  });

  app.use(
    '/wallet/paystack/webhook',
    bodyParser.json({ limit: '200kb' }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  setupSwagger(app);

  // ✔ Correct shutdown hook
  const prismaService = app.get(PrismaService);
  app.enableShutdownHooks();

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');

  const isProd = process.env.NODE_ENV === 'production';
  const host = isProd
    ? process.env.RAILWAY_PUBLIC_DOMAIN ||
      process.env.RAILWAY_STATIC_URL ||
      'https://walletservicewithpaystackjwtapikey-production.up.railway.app/'
    : `localhost:${port}`;

  Logger.log(`Server running at ${host}`);
}

bootstrap();
