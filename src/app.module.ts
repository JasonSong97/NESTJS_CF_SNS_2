import { ClassSerializerInterceptor, MiddlewareConsumer, Module, NestMiddleware, NestModule, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PostsModule } from './posts/posts.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsModel } from './posts/entity/posts.entity';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { UsersModel } from './users/entity/users.entity';
import { CommonModule } from './common/common.module';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ENV_DB_DATABASE_KEY, ENV_DB_HOST_KEY, ENV_DB_PASSWORD_KEY, ENV_DB_PORT_KEY, ENV_DB_USERNAME_KEY } from './common/const/env-keys.const';
import { ServeStaticModule } from '@nestjs/serve-static';
import { PUBLIC_FOLDER_PATH } from './common/const/path.const';
import { ImageModel } from './common/entity/image.entity';
import { LogMiddleware } from './common/middleware/log.middleware';
import { ChatsModule } from './chats/chats.module';
import { ChatsModel } from './chats/entity/chats.entity';
import { MessagesModel } from './chats/messages/entity/messages.entity';
import { CommentsModule } from './posts/comments/comments.module';
import { CommentsModel } from './posts/comments/entity/comments.entity';
import { RolesGuard } from './users/guard/roles.guard';
import { AccessTokenGuard } from './auth/guard/bearer-token.guard';
import { UserFollowersModel } from './users/entity/user-followers.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env', // nest.js에서 사용될 env 닉네임
      isGlobal: true, // AppModule에 설정해주면 어디서든 사용 가능
    }),
    TypeOrmModule.forRoot({ // forRoot(): 연결(TypeORM과 Nest.js 연결 메소드)
      // Object 입력 -> VSCode에서 Postgres와 연결할 때 사용한 정보와 동일
      type: 'postgres', // 데이터베이스 타입
      host: process.env[ENV_DB_HOST_KEY],
      port: parseInt(process.env[ENV_DB_PORT_KEY]),
      username: process.env[ENV_DB_USERNAME_KEY],
      password: process.env[ENV_DB_PASSWORD_KEY],
      database: process.env[ENV_DB_DATABASE_KEY],
      entities: [
        // 데이터베이스와 연동될 Model
        PostsModel,
        UsersModel,
        ImageModel,
        ChatsModel,
        MessagesModel,
        CommentsModel,
        UserFollowersModel
      ],
      synchronize: true, // Nest.js의 TypeORM 코드와 데이터베이스의 싱크를 자동으로 맞출거냐? / PROD인 경우에는 false로
    }),
    PostsModule,
    UsersModule,
    AuthModule,
    CommonModule,
    ServeStaticModule.forRoot({
      // 4022.jpg      
      rootPath: PUBLIC_FOLDER_PATH, // http://localhost:3000/posts/4022.jpg
      serveRoot: '/public' // http://localhost:3000/public/posts/4022.jpg
    }),
    ChatsModule,
    CommentsModule,
  ],
  controllers: [AppController],
  providers: [AppService, 
    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor, // 다른 모듈에서도 ClassSerializerInterceptor를 적용받는다.
    },
    {
      // 보안을 위해서는 기본값을 이렇게 만든다
      // AccessToken -> RolesGuard
      provide: APP_GUARD,
      useClass: AccessTokenGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard
    }
  ],
})
export class AppModule implements NestModule{

  configure(consumer: MiddlewareConsumer) { // 미들웨어를 소비한다.
    consumer.apply(
      // 적용하고 싶은 미들웨어 넣기
      LogMiddleware,
    ).forRoutes({
      path: '*',
      method: RequestMethod.ALL, // GET 도 가능
    })
  }
}
