import { IsNumber } from "class-validator";

export class CreateChatDto {

     // 첫 번째 파라미터는 어떤 숫자들인지
     // 두 번쨰 파라미터는 각각 검증할 거야?
     @IsNumber({}, {each: true})
     userIds: number[];
}