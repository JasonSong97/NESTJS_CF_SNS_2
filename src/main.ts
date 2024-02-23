import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/exception-filter/http-exception-filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // nest.js에 전반적으로 작용할 Pipe
  // new ValidationPipe(): 
  //  1) 모든 클래스 validator의 @IsString()같은 어노테이션들이 따로 module에 적용하거나 추가하지 않아도 app 전반적으로 validator를 사용할 수 있게됨
  //  2) global
  //  3) validator들이 실행되도록 만들어주는 코드
  app.useGlobalPipes(new ValidationPipe({
    transform: true, // 변화는 해도 된다.
    transformOptions: {
      enableImplicitConversion: true // 임의로 변환하는 것을 허가한다.
    },
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  // // Exception Filter 전역 적용
  // app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(3000);
}
bootstrap();
