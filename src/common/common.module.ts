import { BadRequestException, Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { CommonController } from './common.controller';
import { MulterModule } from '@nestjs/platform-express';
import { extname } from 'path';
import * as multer from 'multer';
import {v4 as uuid} from 'uuid'; // 일반적으로 많이 사용하는 버전 v4
import { TEMP_FOLDER_PATH } from './const/path.const';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    MulterModule.register({
      // 파일을 다룰 떄 여러가지 옵션 기능
      limits: {
        // 바이트 단위로 입력
        fileSize: 10000000,
      },
      fileFilter: (req, file, cb) => { // req: 요청 | file: req에 들어있는 파일
        /**
         * cb(에러, boolean)
         * 
         * 첫번째 파라미터에는 에러가 있을경우 에러정보를 넣어준다.
         * 두번쨰 파라미터는 파일을 받을지 말지 boolean을 넣어준다.
         */

        // asdasd.jpg -> .jpg
        const extension = extname(file.originalname);

        if (extension !== '.jpg' && extension !== '.jpeg' && extension !== '.png') {
          return cb(new BadRequestException('jpg/jpeg/png 파일만 없로드 가능합니다. '), false); // cb(에러, boolean)
        }
        return cb(null, true); // 파일을 받는다.
      },
      storage: multer.diskStorage({
        // 파일 저장시 어디로 이동 시킬까?
        destination: function(req, res, cb) { 
          cb(null, TEMP_FOLDER_PATH); // 파일 업로드 위치
        },
        // 파일 이름 뭐로 지을래?
        filename: function(req, file, cb) {
          // uuid + file의 확장자
          cb(null, `${uuid()}${extname(file.originalname)}`); // POST_IMAGE_PATH로 이동
        }
      }),
    }),
  ],
  controllers: [CommonController],
  providers: [CommonService],
  exports: [CommonService]
})
export class CommonModule {}
