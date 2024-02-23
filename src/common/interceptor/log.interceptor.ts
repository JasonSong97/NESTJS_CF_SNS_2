import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable, map, tap } from "rxjs";

@Injectable()
export class LogInterceptor implements NestInterceptor {
     
     // Observable: Rxjs에서 제공해주는 stream 같은 기능
     intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> {
          /**
               * Request 요청이 들어온 timestamp를 찍는다.
               * [REQ] {요청 path} {요청 시간}
               * 
               * 요청이 끝날때 (응답이 나갈때) 다시 timestamp를 찍는다.
               * [RES] {요청 path} {응답 시간} {얼마나 걸렸는지 ms}
               */
          const now = new Date();
          const request = context.switchToHttp().getRequest();
          const path = request.originalUrl; // /posts, /common/image
          
          console.log(`[REQ] ${path} ${now.toLocaleString('kr')}`); // [REQ] {요청 path} {요청 시간}
          // 여기까지는 함수에 interceptor 적용시, 함수 적용에 전에 작동함 -> endpoint 실행되기 전에 미리 실행되는 것

          // return next.handle()을 실행하는 순간 -> 라우트의 로직이 전부 실행되고 응답이 반환된다.
          // observable(응답을 받아서 자유롭게 변형이 가능한 것)로
          return next
               .handle() // 응답값 반환
               .pipe(
                    // 원하는 rxjs의 함수들을 무한히 넣을 수 있다. 그리고 이 함수들은 응답에 대해서 순서대로 실행이 된다.
                    tap( // 모니터링은 가능하지만 변형은 못함
                         // observable은 handle에서 받은 응답값이 들어감, 여기서 response를 볼 수 있음
                         (observable) => console.log(`[REQ] ${path} ${new Date().toLocaleString('kr')} ${new Date().getMilliseconds() - now.getMilliseconds()}ms`),
                    ),







                    // map( // 변형
                    //      (observable) => {
                    //           return {
                    //                message: '응답이 변경 됐습니다. ',
                    //                response: observable,
                    //           }
                    //      }
                    // ),
               );
     }
}