import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.use('/graphql', graphqlUploadExpress({ maxFiles: 10 }));
  await app.listen(3000, '0.0.0.0');
}
bootstrap();
