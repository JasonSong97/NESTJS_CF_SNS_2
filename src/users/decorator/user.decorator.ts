import { UsersModel } from '../entity/users.entity';
import { ExecutionContext, InternalServerErrorException, createParamDecorator } from "@nestjs/common";

// 콜백함수, data: 데코레이터 내부에 입력해주는 값
// data: key of UsersModel | undefined: data에는 UsersModel의 키값만 가능 또는 undefined
export const User = createParamDecorator((data: keyof UsersModel | undefined, context:ExecutionContext) => {
     const req = context.switchToHttp().getRequest();
     const user = req.user as UsersModel; // '사용자 모델이다' 라는 의미
     if (!user) throw new InternalServerErrorException('User 데코레이터는 AccessTokenGuard와 함께 사용해야 합니다. ');
     if (data) return user[data];
     return user; // User 데코레이터를 parameter에 사용했을 때, parameter의 arg 값 return
});