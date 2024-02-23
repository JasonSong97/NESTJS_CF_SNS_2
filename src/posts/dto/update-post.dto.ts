import { PartialType } from '@nestjs/mapped-types';
import { CreatePostDto } from './create-post.dto';
import { IsOptional, IsString } from 'class-validator';
import { stringValidationMessage } from 'src/common/validation-message/string-validation.message';

// extends PickType(PostsModel, ['title', 'content']) 동일
// Partial: 전부다 require가 아닌 optional로 만들어주는 것 -> 즉 선택적 상속
export class UpdatePostDto extends PartialType(CreatePostDto){
    // @IsOptional()을 사용하면 Optional 값으로 validation할 수 있다.

    @IsString({
        message: stringValidationMessage
    })
    @IsOptional()
    title?: string;

    @IsString({
        message: stringValidationMessage
    })
    @IsOptional()
    content?: string;
}