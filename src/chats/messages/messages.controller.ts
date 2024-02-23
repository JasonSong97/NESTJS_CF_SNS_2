import { Controller, Get, Param, ParseIntPipe, Query } from "@nestjs/common";
import { ChatsMessagesService } from "./messages.service";
import { BasePaginationDto } from "src/common/dto/base-pagination.dto";

@Controller('chats/:cid/messages')
export class MessagesController {

     constructor(
          private readonly messagesService: ChatsMessagesService,
     ) {}

     @Get()
     paginateMessage(
          @Param('cid', ParseIntPipe) id: number,
          @Query() dto: BasePaginationDto,
     ) {
          return this.messagesService.paginateMessages(
               dto,
               { // overrideOption
                    where: {
                         // 특정 chat에 관련된 id만 필터링됨
                         chat: {
                              id,
                         }
                    },
                    relations: {
                         author: true,
                         chat: true,
                    }
               }
          );
     }
}