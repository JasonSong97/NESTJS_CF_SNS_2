import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from "@nestjs/websockets";
import { Socket, Server } from "socket.io";
import { CreateChatDto } from "./dto/create-chat.dto";
import { ChatsService } from "./chats.service";
import { EnterChatDto } from "./dto/enter-chat.dto";
import { CreateMessagesDto } from "./messages/dto/create-message.dto";
import { ChatsMessagesService } from "./messages/messages.service";
import { UseFilters, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { SocketCatchHttpExceptionFilter } from "src/common/exception-filter/socket-catch-http.exception-filter";
import { SocketBearerTokenGuard } from "src/auth/guard/socket/socket-bearer-token.guard";
import { UsersModel } from "src/users/entity/users.entity";
import { UsersService } from "src/users/users.service";
import { AuthService } from "src/auth/auth.service";

@WebSocketGateway({
     // ws:localhost:3000/chats
     namespace: '/chats',
})
export class ChatsGateway implements OnGatewayConnection, OnGatewayInit, OnGatewayDisconnect{

     constructor(
          private readonly chatsService: ChatsService,
          private readonly messagesService: ChatsMessagesService,
          private readonly usersService: UsersService,
          private readonly authService: AuthService,
     ){}

     @WebSocketServer()
     server: Server;

     afterInit(server: any) { // server: Server;과 동일한 값을 받는다.
         console.log(`after gateway init`);
     }

     // 연결 끊긴 이후
     handleDisconnect(socket: Socket) {
          console.log(`on disconnect called : ${socket.id}`);
     }

     // implements OnGatewayConnection
     async handleConnection(socket: Socket & {user: UsersModel}) {
          console.log(`on connect called : ${socket.id}`); // 어떤 id 소켓이 연결됨?
          const headers = socket.handshake.headers; // 헤더 가져오기
          const rawToken = headers['authorization']; // Bearer xxx
          if (!rawToken) socket.disconnect(); // 토큰이 없으면 연결 끊기

          try {
               const token = this.authService.extractTokenFromHeader(
                    rawToken,
                    true
               );

               const payload = this.authService.verifyToken(token);
               const user = await this.usersService.getUserByEmail(payload.email);

               socket.user = user;
               console.log(socket.user.id);
               return true;
          } catch (error) { 
               socket.disconnect(); // 에러가 나면 연결 끊기
          }
     }

     @UsePipes(new ValidationPipe({
          transform: true, // 변화는 해도 된다.
          transformOptions: {
            enableImplicitConversion: true // 임의로 변환하는 것을 허가한다.
          },
          whitelist: true,
          forbidNonWhitelisted: true,
     }))
     @UseFilters(SocketCatchHttpExceptionFilter)
     @SubscribeMessage('enter_chat')
     async enterChat(
          // Room의 Id를 리스트로 받는다.
          @MessageBody() data: EnterChatDto,
          // 지금 현재 연결된 소켓
          @ConnectedSocket() socket: Socket & {user: UsersModel},
     ) {  
          for (const chatId of data.chatIds) {
               const exists = await this.chatsService.checkIfChatExists(
                    chatId,
               );

               if (!exists) {
                    throw new WsException({
                         code: 100,
                         message: `존재하지 않는 chat 입니다. chatId: ${chatId}`,
     
                    });
               }
               
          }

          socket.join(data.chatIds.map((x) => x.toString()));

          // for (const chatId of data) {
          //      // socket.join()
          //      // join은 string만 받는다.
          //      socket.join(chatId.toString());
          // }
     }

     @UsePipes(new ValidationPipe({
          transform: true, // 변화는 해도 된다.
          transformOptions: {
            enableImplicitConversion: true // 임의로 변환하는 것을 허가한다.
          },
          whitelist: true,
          forbidNonWhitelisted: true,
     }))
     @UseFilters(SocketCatchHttpExceptionFilter)
     @SubscribeMessage('create_chat')
     async createChat(
          @MessageBody() data: CreateChatDto,
          // 인터섹션: user가 UsersModel이라고 존재한다.
  	     // 토큰이 통과되면 user가 있다는 것을 알 수 있다.
          @ConnectedSocket() socket: Socket & {user: UsersModel},
     ) {
          const chat = await this.chatsService.createChat(
               data, 
          );
     }

     @UsePipes(new ValidationPipe({
          transform: true, // 변화는 해도 된다.
          transformOptions: {
            enableImplicitConversion: true // 임의로 변환하는 것을 허가한다.
          },
          whitelist: true,
          forbidNonWhitelisted: true,
     }))
     @UseFilters(SocketCatchHttpExceptionFilter)
     @SubscribeMessage('send_message') // socket.on('send_message', (message) => {console.log(message)});
     async sendMessage(
          @MessageBody() dto: CreateMessagesDto,
          @ConnectedSocket() socket: Socket & {user: UsersModel},
     ) {
          const chatExists = await this.chatsService.checkIfChatExists(
               dto.chatId,
          );

          if (!chatExists) {
               throw new WsException(
                    `존재하지 않는 채팅방입니다. Chat ID : ${dto.chatId}`,
               );
          }

          // 메세지 생성
          const message = await this.messagesService.createMessage(
               dto,
               socket.user.id
          );

          // 소켓 속에다가 생성된 메시지를 기반으로, 해당되는 방에다가 메시지를 보낸다.
          socket.to(message.chat.id.toString()).emit('receive_message', message.message);

          // this.server.in(
          //      // message.chatId에 해당하는 Room
          //      message.chatId.toString()
          // ).emit('receive_message', message.message);
     }
}