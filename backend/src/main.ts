import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

console.log('>>> MAIN.TS LOADED <<<');
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  console.log('MONGODB_URI =', process.env.MONGODB_URI);

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);

  console.log(`API running on http://localhost:${port}`);
}
bootstrap();