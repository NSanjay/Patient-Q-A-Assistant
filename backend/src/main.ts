import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:8081'];
  app.enableCors({
    origin: allowedOrigins,
  });
  await app.listen(process.env.PORT ?? 3000);
  console.log(`Backend running on http://localhost:3000`);
}
bootstrap();
