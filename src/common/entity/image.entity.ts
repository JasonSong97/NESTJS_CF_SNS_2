import { Column, Entity, ManyToOne } from "typeorm";
import { BaseModel } from "./base.entity";
import { IsEnum, IsInt, IsOptional, IsString } from "class-validator";
import { Transform } from "class-transformer";
import { join } from "path";
import { POST_IMAGE_PATH, POST_PUBLIC_IMAGE_PATH } from "../const/path.const";
import { PostsModel } from "src/posts/entity/posts.entity";

export enum ImageModelType {
     POST_IMAGE,
}

@Entity()
export class ImageModel extends BaseModel {

     @Column({
          default: 0, // order가 FE로부터오면 그대로 반영, FE로부터 아무런 값이 오지않으면 0하고 생성된 순서대로 만들 것
     })
     @IsInt()
     @IsOptional()
     order: number;

     // UsersModel -> 사용자 프로필 이미지
     // PostsModel -> 포스트 이미지
     @Column({
          enum: ImageModelType
     })
     @IsString()
     @IsEnum(ImageModelType)
     type: ImageModelType;

     @Column()
     @IsString()
     @Transform(({value, obj}) => { // obj: 현재 객체, ImageModel이 instance로 되었을 때
          if (obj.type === ImageModelType.POST_IMAGE) {
               return `/${join( // 시작 부분 / 추가한 것
                    POST_PUBLIC_IMAGE_PATH, // POST_IMAGE_PATH 경로에 path를 추가
                    value,
               )}`
          } else {
               return value;
          }
     })
     path: string;

     @ManyToOne((type) => PostsModel, (post) => post.images)
     post?: PostsModel;
}