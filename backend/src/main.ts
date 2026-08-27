import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Default Express JSON body limit (100kb) is too small for the Customer Portal's
  // face-consent upload (a photo sent as a base64 data URI in the JSON body — see
  // customer.service.ts#submitFaceConsent). Raised app-wide rather than per-route.
  app.useBodyParser('json', { limit: '10mb' });

  app.use(cookieParser());

  const allowedOrigins = [
    ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : []),
    ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : []),
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:3000',
  ].map((url) => url.trim()).filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      const isLocalhost =
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:');
      const isFitflowDomain =
        origin === 'https://fitflow.io.vn' ||
        origin === 'http://fitflow.io.vn' ||
        origin.endsWith('.fitflow.io.vn') ||
        origin.endsWith('.vercel.app');

      if (isLocalhost || isFitflowDomain || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Blocked by CORS: ${origin}`));
      }
    },
    credentials: true,
  });
  app.setGlobalPrefix((process.env.API_PREFIX || '/api/v1').replace(/^\//, ''));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(process.env.PORT ?? 5000);
}
bootstrap();
