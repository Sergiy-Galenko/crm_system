import "reflect-metadata";

import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";
import { AppModule } from "@backend/app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());
  app.enableCors({
    credentials: true,
    origin: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: false,
    }),
  );
  app.setGlobalPrefix("api");

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
}

void bootstrap();
