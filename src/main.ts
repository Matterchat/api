import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ApiConfiguration } from '@matterchat/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // TODO: Add CORS configuration
  app.enableCors();

  await app.listen(ApiConfiguration.http.port);
}

void bootstrap();
