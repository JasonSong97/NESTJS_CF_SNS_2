import { DataSource } from 'typeorm';
import { CallHandler, ExecutionContext, Injectable, InternalServerErrorException, NestInterceptor } from "@nestjs/common";
import { Observable, catchError, tap } from "rxjs";

@Injectable()
export class TransactionInterceptor implements NestInterceptor {

     constructor(
          private readonly dataSource: DataSource,
     ) {}

     async intercept(context: ExecutionContext, next: CallHandler<any>): Promise<Observable<any>> {
          const request = context.switchToHttp().getRequest();
          const queryRunner = this.dataSource.createQueryRunner(); // 트랜젝션과 관련된 모든 쿼리를 담당할 쿼리 러너를 생성한다.
          await queryRunner.connect(); // 쿼리 러너에 연결한다.

          // 쿼리 러너에서 트랜젝션을 시작한다.
          // 이 시점부터 같은 쿼리 러너를 사용하면
          // 트랜젝션 안에서 데이터베이스 액션을 실행 할 수 있다.
          await queryRunner.startTransaction();
          request.queryRunner = queryRunner; // 내부 로직 실행시키기 위해서 queryRunner 넣어주기

          return next
               .handle()
               .pipe(
                    catchError(
                         async (error) => {
                              await queryRunner.rollbackTransaction(); // 어떤 에러든 에러가 던져지면 트랜젝션을 종료하고 워래 상태로 되돌린다.
                              await queryRunner.release();
                              throw new InternalServerErrorException(error.message);
                         }
                    ),
                    tap(async () => {
                         await queryRunner.commitTransaction(); // 정상적으로 진행된 경우, commit -> release
                         await queryRunner.release();
                    })
               );
     }
}