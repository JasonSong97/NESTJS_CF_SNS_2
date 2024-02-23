import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from "@nestjs/common";

@Catch(HttpException) // 이곳에 해당되는 에러만 잡는다.
export class HttpExceptionFilter implements ExceptionFilter {

     catch(exception: HttpException, host: ArgumentsHost) {
          const context = host.switchToHttp();
          const response = context.getResponse();
          const request = context.getRequest();
          const status = exception.getStatus();

          // 로그 파일을 생성하거나
          // 에러 모니터링 시스템에 API 콜 하기

          response
               .status(status)
               .json({
                    statusCode: status,
                    message: exception.message,
                    timestamp: new Date().toLocaleString('kr'),
                    path: request.url, // 어떤 url에서 에러 발생 했는지 알 수 있음
               });
     }
}