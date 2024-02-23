import { PickType } from "@nestjs/mapped-types";
import { CommentsModel } from "../entity/comments.entity";

export class CreateCommentsDto extends PickType(CommentsModel, [
     'comment' // comment 프로퍼티만 상속받기
]) {}