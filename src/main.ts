import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ApiConfiguration } from '@matterchat/config';
import { ClassSerializerInterceptor, VersioningType } from '@nestjs/common';
import { ApiVersion } from '@matterchat/contracts';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // TODO: Add CORS configuration
  app.enableCors();
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: ApiVersion.v1,
  });

  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(new ClassSerializerInterceptor(reflector));

  await app.listen(ApiConfiguration.http.port);
}

void bootstrap();
