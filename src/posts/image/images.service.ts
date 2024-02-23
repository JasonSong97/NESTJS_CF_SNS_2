import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { basename, join } from "path";
import { POST_IMAGE_PATH, TEMP_FOLDER_PATH } from "src/common/const/path.const";
import { ImageModel } from "src/common/entity/image.entity";
import { QueryRunner, Repository } from "typeorm";
import { CreatePostImageDto } from "./dto/create-image.dto";
import { promises } from "fs";

@Injectable()
export class PostsImagesService{

     constructor(
          @InjectRepository(ImageModel)
          private readonly imageRepository: Repository<ImageModel>,
     ){}

     getRepository(queryRunner?: QueryRunner) {
          return queryRunner ? queryRunner.manager.getRepository<ImageModel>(ImageModel) : this.imageRepository;
     }

     async createPostImage(dto: CreatePostImageDto, queryRunner?: QueryRunner) {
          const repository = this.getRepository(queryRunner);


          // dto의 이름을 기반으로 파일의 경로를 생성한다.
          const tempFilePath = join( // 이미지의 절대경로를 tempFilePath로
               TEMP_FOLDER_PATH,
               dto.path,
          );

          try { // import { promises } from 'fs'
               // 파일이 존재하는지 확인
               // 만약에 파일이 존재하지 않으면 에러를 던짐
               await promises.access(tempFilePath);
          } catch (error) {
               throw new BadRequestException('존재하지 않는 파일입니다. ');
          }

          // 파일의 이름만 가져오기
          // /Users/aaa/bbb/ccc/asdad.jpg -> asdad.jpg
          const fileName = basename(tempFilePath);

          // 새로 이동할 포스트 폴더의 경로 + 이미지 이름
          // {프로젝트 경로}/public/posts/asdad.jpg
          const newPath = join(
               POST_IMAGE_PATH,
               fileName,
          );

          // save
          const result = await repository.save({
               ...dto, // create하고 save도 가능하고 바로 넣어도 상관없음
          });

          // 파일 옮기기
          await promises.rename(tempFilePath, newPath);
          return result;
     }
}