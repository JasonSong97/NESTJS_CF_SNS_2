import { Column, CreateDateColumn, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { RolesEnum } from "../const/roles.const";
import { PostsModel } from "src/posts/entity/posts.entity";
import { BaseModel } from "src/common/entity/base.entity";
import { IsEmail, IsString, Length, ValidationArguments } from "class-validator";
import { lengthValidationMessage } from "src/common/validation-message/length-validation.message";
import { stringValidationMessage } from "src/common/validation-message/string-validation.message";
import { emailValidationMessage } from "src/common/validation-message/email-validation.message";
import { Exclude, Expose } from "class-transformer";
import { ChatsModel } from "src/chats/entity/chats.entity";
import { MessagesModel } from "src/chats/messages/entity/messages.entity";
import { CommentsModel } from "src/posts/comments/entity/comments.entity";
import { UserFollowersModel } from "./user-followers.entity";

@Entity()
export class UsersModel extends BaseModel {

     @Column({
          length: 20, // 길이가 20넘으면 안됨
          unique: true, // 유일무이한 값이 될 것
     })
     @IsString({
          message: stringValidationMessage
     })
     @Length(1, 20, {
          message: lengthValidationMessage
     })
     nickname: string;

     @Column({
          unique: true,
     })
     @IsString({
          message: stringValidationMessage
     })
     @IsEmail({}, { // {}은 이메일 검증에 대한 정보
          message: emailValidationMessage
     })
     email: string;

     @Column()
     @IsString({
          message: stringValidationMessage
     })
     @Length(3, 8, {
          message: lengthValidationMessage
     })
     /**
      * FE --> BE(request)
      *   plain object(JSON) -> class instance(DTO)
      * 
      * BE --> FE(response)
      *   class instance(DTO) -> plain object(JSON)
      * 
      * toClassOnly: class로 변환될 때만, request
      * toPlainOnly: plain으로 변환될 떄만, response
      */
     @Exclude({
          toPlainOnly: true,
     })
     password: string;

     @Column({
          enum: Object.values(RolesEnum), // RolesEnum에 있는 모든 value들을 가지고 사용할 것이다.
          default: RolesEnum.USER,
     })
     role: RolesEnum;

     @OneToMany(() => PostsModel, (post) => post.author)
     posts: PostsModel[];

     @ManyToMany(() => ChatsModel, (chat) => chat.users)
     chats: ChatsModel[];

     @OneToMany(() => MessagesModel, (message) => message.author)
     messages: MessagesModel;

     @OneToMany(() => CommentsModel, (comment) => comment.author)
     postComments: CommentsModel[];

     // 내가 팔로우 하고 있는 사람들
     @OneToMany(() => UserFollowersModel, (ufm) => ufm.follower)
     followers: UserFollowersModel[];

     // 나를 팔로우 하고 있는 사람들
     @OneToMany(() => UserFollowersModel, (ufm) => ufm.followee)
     followees: UserFollowersModel[];

     @Column({
          default: 0
     })
     followerCount: number;

     @Column({
          default: 0
     })
     followeeCount: number;

     // @Expose()
     // get nicknameAndEmail() {
     //      return this.nickname + '/' + this.email;
     // }
}