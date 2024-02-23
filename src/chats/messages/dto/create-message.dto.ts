import { PickType } from "@nestjs/mapped-types";
import { MessagesModel } from "../entity/messages.entity";
import { IsNumber } from "class-validator";

export class CreateMessagesDto extends PickType(MessagesModel, [
     'message', // MessagesModel에서 message를  제외하고는 전부 객체이기 때문에
]) {
     @IsNumber()
     chatId: number;

     // @IsNumber()
     // authorId: number; // 원래는 작성자의 이름을 이렇게 주면 안된다. CC) accessToken -> 임시로
}