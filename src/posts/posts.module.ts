import { BadRequestException, MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsModel } from './entity/posts.entity';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';
import { CommonModule } from 'src/common/common.module';
import { MulterModule } from '@nestjs/platform-express';
import { extname } from 'path';
import * as multer from 'multer';
import { POST_IMAGE_PATH } from 'src/common/const/path.const';
import {v4 as uuid} from 'uuid'; // 일반적으로 많이 사용하는 버전 v4
import { ImageModel } from 'src/common/entity/image.entity';
import { PostsImagesService } from './image/images.service';
import { LogMiddleware } from 'src/common/middleware/log.middleware';

@Module({
  imports: [
    // PostsModule에서 사용할 Repository 등록
    TypeOrmModule.forFeature([ // forFeature(): 주입
      // 불러오고 싶은 Model을 넣어주면 된다.
      PostsModel,
      ImageModel,
    ]),
    AuthModule,
    UsersModule,
    CommonModule,
  ],
  controllers: [PostsController],
  providers: [PostsService, PostsImagesService,],
  exports: [PostsService]
})
export class PostsModule{
  // implements NestModule
  // 전부 app.module.ts로 옮기기!
}
