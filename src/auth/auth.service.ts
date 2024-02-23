import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersModel } from 'src/users/entity/users.entity';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { RegisterUserDto } from './dto/register-user.dto';
import { ConfigService } from '@nestjs/config';
import { ENV_HASH_ROUNDS_KEY, ENV_JWT_SECRET_KEY } from 'src/common/const/env-keys.const';

@Injectable()
export class AuthService {

     constructor(
          private readonly jwtService: JwtService,
          private readonly usersService: UsersService,
          private readonly configService: ConfigService,
     ) {}

     /**
      * 토큰을 사용하게 되는 방식
      * 
      * 1) 사용자가 로그인 또는 회원가입을 진행하면 accessToken과 refreshToken을 발급받는다.
      * 2) 로그인 할때는 Basic 토큰과 함께 요청을 보낸다. Basic 토큰은 '이매일:비밀번호' Base64로 인코딩한 형태이다.
      *    ex) {authorization: 'Basic {token}'}
      * 3) 아무나 접근 할 수 없는 정보 (private route)를 접근 할때는 accessToken을 Header에 추가해서 요청과 함께 보낸다.
      *    ex) {authorization: 'Bearer {token}'}
      * 4) 토큰과 요청을 함께 받은 서버는 토큰 검증을 통해 현재 요청을 보낸 사용자가 누구인지 알 수 있다.
      *    예를들어, 현재 로그인한 사용자가 작성한 포스트만 가져오려면 토큰의 sub 값에 입력돼있는 사용자의 포스트만 따로 필터링 할 수 있다.
      *    특정 사용자의 토큰이 없다면 다른 사용자의 데이터를 접근 못한다.
      * 5) 모든 토큰은 만료기한이 있다. 지나면 새로 발급받아야 한다. 그렇지 않으면 jwtService.verify에러 인증이 안된다.
      *    따라서 access와 refresh를 새로 발급받을 수 있는 /auth/token/refresh, /auth/token/access가 필요하다.
      * 6) 토큰이 만료되면 각각의 토큰을 새로 발급 받을 수 있는 엔드포인트에 요청해서 새로 발급 받고, private route에 접근한다.
      */

     /**
      * Header로부터 토큰을 받을 때
      * 
      * {authorization: 'Basic {token}'}
      * {authorization: 'Bearer {token}'}
      */
     extractTokenFromHeader(header: string, isBearer: boolean) {
          const splitToken = header.split(' '); // 'Basic {token}' -> [Basic, {token}] / 'Bearer {token}' -> [Bearer, {token}]
          const prefix = isBearer ? 'Bearer' : 'Basic';
          if (splitToken.length !== 2 || splitToken[0] !== prefix) throw new UnauthorizedException('잘못된 토큰입니다.');     
          const token = splitToken[1];
          return token;
     }

     /**
      * Basic: asdljn1n2l1k2n213l1j23n
      * 
      * 1) asdljn1n2l1k2n213l1j23n -> email:password
      * 2) email:password -> [email, password]
      * 3) {email: email, password: password}
      */
     decodeBasicToken(base64String: string) {
          const decoded = Buffer.from(base64String, 'base64').toString('utf8'); // Node.js에서 제공해주는 기능
          const split = decoded.split(':');
          if (split.length !== 2) throw new UnauthorizedException('잘못된 유형의 토큰입니다.');
          const email = split[0];
          const password = split[1];
          return {
               email,
               password,
          }
     }

     /**
      * 토큰 검증
      */
     verifyToken(token: string) {
          try {
               // verify는 jwt 패키지에 존재
               // payload 받기
               return this.jwtService.verify(token, { 
                    secret: this.configService.get<string>(ENV_JWT_SECRET_KEY),
               });
          } catch (error) {
               throw new UnauthorizedException('토큰이 만료됐거나 잘못된 토큰입니다. ');
          }
     }

     rotateToken(token: string, isRefreshToken: boolean) {
          const decoded = this.jwtService.verify(token, {
               secret: this.configService.get<string>(ENV_JWT_SECRET_KEY),
          });
          /**
           * sub: id
           * email: email
           * type: 'access' | 'refresh'
           */
          if (decoded.type !== 'refresh') throw new UnauthorizedException('토큰 재발급은 refresh 토큰으로만 가능합니다.');
          return this.signToken({ // 토큰 발급받기
               ...decoded,
          }, isRefreshToken);
     }


     /**
      * 우리가 만드려는 기능
      * 
      * 1) registerWithEmail
      *   - email, nickname, password를 입력받고 사용자를 생성한다.
      *   - 생성이 완료되면 accessToken과 refreshToken을 반환한다. -> 바로 로그인을 진행 해주는 것
      * 
      * 2) loginWithEmail
      *   - email,password를 입력하면 사용자 검증을 진행한다.
      *   - 검증이 완료되면 accessToken과 refreshToken을 반환한다.
      * 
      * 3) loginUser
      *   - (1)과 (2)에서 필요한 accessToken과 refreshToken을 반환하는 로직
      * 
      * 4) signToken
      *   - (3)에서 필요한 accessToken과 refreshToken을 sign하는 로직
      * 
      * 5) authenticateWithEmailAndPassword
      *   - (2)에서 로그인을 진행할때 필요한 기본적인 검증 진행
      *        1. 사용자가 존재하는지 확인(null)
      *        2. 비밀번호가 맞는지 확인
      *        3. 모두 통과되면 찾은 사용자 정보 반환
      *        4. loginWithEmail에서 반환된 데이터를 기반으로 토큰 생성
      */

     /**
      * Payload에 들어갈 정보
      * 
      * 1) email
      * 2) sub = id
      * 3) type = 'access' | 'refresh'
      */
     signToken(user: Pick<UsersModel, 'email' | 'id'>, isRefreshToken: boolean) {
          const payload = {
               email: user.email,
               sub: user.id,
               type: isRefreshToken ? 'refresh' : 'access',
          }
          return this.jwtService.sign(payload, {
               secret: this.configService.get<string>(ENV_JWT_SECRET_KEY),
               expiresIn: isRefreshToken ? 3600 : 300, // seconds
          });
     }

     loginUser(user: Pick<UsersModel, 'email' | 'id'>) {
          return {
               accessToken: this.signToken(user, false),
               refreshToken: this.signToken(user, true),
          }
     }

     async authenticateWithEmailAndPassword(user: Pick<UsersModel, 'email' | 'password'>) {
          /**
           * 1. 사용자가 존재하는지 확인 (email) -> userService에다가 기능을 만들기
           * 2. 비밀번호가 맞는지 확인
           * 3. 모두 통과되면 찾은 사용자 정보 반환
           */
          const existingUser = await this.usersService.getUserByEmail(user.email); // 사용자관련 메소드는 해당 모듈에서 관리하자
          if (!existingUser) throw new UnauthorizedException('존재하지 않는 사용자입니다.');

          /**
           * bcrypt.compare(1, 2) 파라미터
           * 
           * 1. 입력된 비밀번호
           * 2. 기존 해시 (hash) -> 사용자 정보에 저장된 hash
           */
          const passOK = await bcrypt.compare(user.password, existingUser.password);
          if (!passOK) throw new UnauthorizedException('비밀번호가 틀렸습니다.');
          return existingUser;
     }

     async loginWithEmail(user: Pick<UsersModel, 'email' | 'password'>) {
          const existingUser = await this.authenticateWithEmailAndPassword(user);
          return this.loginUser(existingUser);
     }

     async registerWithEmail(user: RegisterUserDto) {
          const hash = await bcrypt.hash( // 내부에 salt가 내장
               user.password,
               parseInt(this.configService.get<string>(ENV_HASH_ROUNDS_KEY)), // user.password를 몇번 해싱할 것인지
          );
          const newUser = await this.usersService.createUser({
               ...user,
               password: hash,
          });
          return this.loginUser(newUser);
     }
}
