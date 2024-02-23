import { Injectable, PipeTransform, ArgumentMetadata, BadRequestException } from "@nestjs/common";

@Injectable() // https://docs.nestjs.com/pipes#custom-pipes
export class PasswordPipe implements PipeTransform {  // 공식문서에 PipeTransform을 implements 해야한다.
     transform(value: any, metadata: ArgumentMetadata) {
          /**
           * value : 받는 값
           * metadata : 
           *   Paramtype(body, query, param), 
           *   metatype(id: string할때 string 의미), 
           *   data(@Body('userId')라면 userId)
           */
          if (value.toString().length > 8) throw new BadRequestException('비밀번호는 8자 이하로 입력해주세요.!');
          return value.toString(); 
     }
}

@Injectable()
export class MaxLengthPipe implements PipeTransform {
     constructor(
          private readonly length: number,
     ) {} 
     transform(value: any, metadata: ArgumentMetadata) {
         if (value.toString().length > this.length) throw new BadRequestException(`최대 길이는 ${this.length}입니다.`);
         return value.toString();
     }
}

@Injectable()
export class MinLengthPipe implements PipeTransform {
     constructor(
          private readonly length: number,
          private readonly subject: string,
     ) {}
     transform(value: any, metadata: ArgumentMetadata) {
         if (value.toString().length < this.length) throw new BadRequestException(`${this.subject} 길이는 ${this.length}입니다.`);
         return value.toString();
     }
}