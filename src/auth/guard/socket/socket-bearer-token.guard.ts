import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { WsException } from "@nestjs/websockets";
import { AuthService } from "src/auth/auth.service";
import { UsersService } from "src/users/users.service";

@Injectable()
export class SocketBearerTokenGuard implements CanActivate {

     constructor(
          private readonly authService: AuthService,
          private readonly usersService: UsersService,
     ) {}

     async canActivate(context: ExecutionContext): Promise<boolean> {
          // 지금 연결해서 사용하고 있는 소켓
          const socket = context.switchToWs().getClient();

          // 헤더 가져오기
          const headers = socket.handshake.headers;

          // Bearer xxx
          const rawToken = headers['authorization'];
          if (!rawToken) throw new WsException('토큰이 없습니다. ');

          try {
               const token = this.authService.extractTokenFromHeader(
                    rawToken,
                    true
               );

               const payload = this.authService.verifyToken(token);
               const user = await this.usersService.getUserByEmail(payload.email);

               socket.user = user;
               socket.token = token;
               socket.tokeType = payload.tokenType;
               return true;
          } catch (error) {
               throw new WsException('토큰이 유효하지 않습니다.')
          }
     }
}