import { PickType } from "@nestjs/mapped-types";
import { PostsModel } from "../entity/posts.entity";
import { IsOptional, IsString } from "class-validator";

/**
 * TS에서 사용한 Utilities
 * - Pick, Omit, Partial -> Type 반환, Generic
 * - PickType, OmitType, PartialType -> 값을 반환(따라서 extend 가능), function
 * 
 * extends:는 Type을 상속받지 못하고 값을 상속받아야한다! (중요!)
 * PickType(PostsModel, ['title', 'content']): title과 content만 골라서 상속받기
 */
export class CreatePostDto extends PickType(PostsModel, ['title', 'content']) {

     @IsString({
          each: true, // 리스트 안에있는 것들을 검증 해야한다.
     })
     @IsOptional()
     images: string[] = []; // 아무것도 없는 경우 empty array
}