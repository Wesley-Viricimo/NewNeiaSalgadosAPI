import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import fastifyCors from '@fastify/cors';
import { contentParser } from 'fastify-file-interceptor';

async function bootstrap() {
  const fastifyAdapter = new FastifyAdapter();

  // 2) Registra o plugin de CORS ANTES de criar a app
  fastifyAdapter.register(fastifyCors, {
    origin: ['http://localhost:1420'], // sua URL do frontend
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  });

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    fastifyAdapter,
  );

  app.useGlobalPipes(new ValidationPipe());
  await app.register(contentParser);

  await app.listen(3000);
}
bootstrap();