import { Transform } from "class-transformer";
import { IsString } from "class-validator";
import { join } from "path";
import { POST_PUBLIC_IMAGE_PATH } from "src/common/const/path.const";
import { BaseModel } from "src/common/entity/base.entity";
import { ImageModel } from "src/common/entity/image.entity";
import { stringValidationMessage } from "src/common/validation-message/string-validation.message";
import { UsersModel } from "src/users/entity/users.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { CommentsModel } from "../comments/entity/comments.entity";

@Entity()
export class PostsModel extends BaseModel { // TypeORM이 app.module.ts에 해당 정보들을 기반으로 DB에 생성한다.

     // 1) UsersModel과 연동, Foreign Key
     // 2) Not null
     @ManyToOne(() => UsersModel, (user) => user.posts, {
          nullable: false,
     })
     author: UsersModel;

     @Column()
     @IsString({
          message: stringValidationMessage
     }) 
     title: string;

     @Column()
     @IsString({
          message: stringValidationMessage
     }) 
     content: string;

     // @Column({
     //      nullable: true,
     // })
     // // value가 존재할 경우에만 value 앞에 /public/posts를 붙임, value가 존재하지 않으면 null or undefined
     // @Transform(({value}) => value && `/${join(POST_PUBLIC_IMAGE_PATH, value)}`) // value: image에 입력된 값 의미
     // image?: string;

     @Column()
     likeCount: number;

     @Column()
     commentCount: number;

     @OneToMany((type) => ImageModel, (image) => image.post)
     images: ImageModel[];

     @OneToMany(() => CommentsModel, (comment) => comment.post)
     comments: CommentsModel[];
     
}