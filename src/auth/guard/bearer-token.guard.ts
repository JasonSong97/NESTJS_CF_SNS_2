import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "../auth.service";
import { UsersService } from "src/users/users.service";
import { Reflector } from "@nestjs/core";
import { IS_PUBLIC_KEY } from "src/common/decorator/is-public.decorator";

@Injectable()
export class BearerTokenGuard implements CanActivate {

     constructor(
          private readonly authService: AuthService,
          private readonly userService: UsersService,
          private readonly reflector: Reflector,
     ) {}

     async canActivate(context: ExecutionContext): Promise<boolean> {
          // 토큰을 검증하기 전에 reflect metadata 기능을 사용해서 
          // public route를 달았는지 안 달았는지를 확인하는 검증을 하고
          // 달려있으면 바로 true를 반환하는 기능
          const isPublic = this.reflector.getAllAndOverride(
               IS_PUBLIC_KEY,
               [
                    context.getHandler(),
                    context.getClass(),
               ]
          );
          
          const req = context.switchToHttp().getRequest();
          if (isPublic) {
               req.isRoutePublic = true;
               return true;
          }

          const rawToken = req.headers['authorization'];
          if (!rawToken) throw new UnauthorizedException('토큰이 없습니다.');
          const token = this.authService.extractTokenFromHeader(rawToken, true);
          const result = await this.authService.verifyToken(token); // token 검증(신뢰가능) -> result에는 payload(user, token, tokenType)

         /**
          * request에 넣을 정보
          * 
          * 1) 사용자 정보 - user
          * 2) token - token
          * 3) tokenType - access | refresh
          */
          const user = await this.userService.getUserByEmail(result.email);

          req.token = token;
          req.tokenType = result.type;
          req.user = user;
          return true;
     }
}

@Injectable()
export class AccessTokenGuard extends BearerTokenGuard {
     async canActivate(context: ExecutionContext): Promise<boolean> {
          await super.canActivate(context); // 기존의 Bearer토큰 검증 절차 + tokenType을 가져옴 
          const req = context.switchToHttp().getRequest();
          if (req.isRoutePublic) return true;
          if (req.tokenType !== 'access') throw new UnauthorizedException('Access Token이 아닙니다.');
          return true;
     }
}

@Injectable()
export class RefreshTokenGuard extends BearerTokenGuard {
     async canActivate(context: ExecutionContext): Promise<boolean> {
          await super.canActivate(context);
          const req = context.switchToHttp().getRequest();
          if (req.isRoutePublic) return true;
          if (req.tokenType !== 'refresh') throw new UnauthorizedException('Refresh Token이 아닙니다.');
          return true;
     }
}