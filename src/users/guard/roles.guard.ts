import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "../decorator/roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {

     constructor(
          private readonly reflector: Reflector,
     ) {}

     async canActivate(context: ExecutionContext): Promise<boolean> {
          /**
          * Roles annotation에 대한 metadata를 가져와야한다.
          * 
          * Reflector: IoC에서 자동으로 주입을 받을 수 있다.
          * getAllAndOverride(): 
          *    ROLES_KEY에 해당되는 annotation에 대한 정보를 전부 가져옵니다.
          *    그중에서 가장 가까운 값을 가져와서 override(덮어씌운다)한다.
          *    EX) 컨트롤러에 붙여도, 메소드에 적용된 어노테이션을 가져온다.
          */ 
          const requireRole = this.reflector.getAllAndOverride(
               ROLES_KEY,
               [
                    // 어떤 context에서 가져올거야?
                    context.getHandler(),
                    context.getClass()
               ]
          );

          // Roles Annotation 등록 X
          if (!requireRole) return true;

          // RolesGuard를 실행하기전에 AccessToken이 통과되기 때문에
          const {user} = context.switchToHttp().getRequest();
          if (!user) throw new UnauthorizedException(`토큰을 제공해주세요! `);
          if (user.role !== requireRole) throw new ForbiddenException(`이 작업을 수행할 권한이 없습니다. ${requireRole} 권한이 필요합니다.`);
          return true;
     }
}