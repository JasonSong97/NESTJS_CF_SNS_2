import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ChatsModel } from './entity/chats.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateChatDto } from './dto/create-chat.dto';
import { CommonService } from 'src/common/common.service';
import { PaginateChatDto } from './dto/paginate-chat.dto';

@Injectable()
export class ChatsService {

     constructor(
          @InjectRepository(ChatsModel)
          private readonly chatRepository: Repository<ChatsModel>,
          private readonly commonService: CommonService,
     ) {}

     paginateChats(dto: PaginateChatDto) {
          return this.commonService.paginate(
               dto,
               this.chatRepository,
               {
                    relations: {
                         users: true,
                    }
               },
               'chats'
          );
     }
     
     async createChat(dto: CreateChatDto) {
          // await가 붙어있으면 async 필요
          const chat = await this.chatRepository.save({
               // 1, 2, 3
               // [{id:1}, {id:2}, {id:3}]
               users: dto.userIds.map((id) => ({id})),
          });

          return this.chatRepository.findOne({
               where: {
                    id: chat.id,
               },
          });
     }

     async checkIfChatExists(chatId: number) {
          const exists = await this.chatRepository.exists({
               where: {
                    id: chatId,
               },
          });
          return exists;
     }
}
