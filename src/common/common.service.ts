import { BadRequestException, Injectable } from '@nestjs/common';
import { BasePaginationDto } from './dto/base-pagination.dto';
import { FindManyOptions, FindOptionsOrder, FindOptionsWhere, Repository } from 'typeorm';
import { BaseModel } from './entity/base.entity';
import { FILTER_MAPPER } from './const/filter-mapper.const';
import { ConfigService } from '@nestjs/config';
import { ENV_HOST_KEY, ENV_PROTOCOL_KEY } from './const/env-keys.const';

@Injectable()
export class CommonService {

     constructor (
          private readonly configService: ConfigService,
     ) {}

     // 페이지네이션을 구현하는 Entity는 대부분 BaseExtends를 상속받습니다.
     paginate<T extends BaseModel>(
          dto: BasePaginationDto,
          repository: Repository<T>,
          overrideFindOptions: FindManyOptions<T> = {}, // 만약에 상위에서 사용하고 싶은 option이 있으면 덮어씌우게 만드는 것
          path: string,
     ) {
          if (dto.page) return this.pagePaginate(dto, repository, overrideFindOptions);
          else return this.cursorPaginate(dto, repository, overrideFindOptions, path);
     }

     // private 하는 이유는 우리는 pagePaginate와 cursorPaginate를 사용할 필요가 없어서 가리기 용
     private async pagePaginate<T extends BaseModel>( // page 기반 페이지네이션은 page는 필요 없습니다.
          dto: BasePaginationDto,
          repository: Repository<T>,
          overrideFindOptions: FindManyOptions<T> = {},
     ) {
          const findOptions = this.composeFindOptions<T>(dto);
          const [data, count] = await repository.findAndCount({
               ...findOptions,
               ...overrideFindOptions,
          });
          return {
               data,
               total: count,
          }
     }

     private async cursorPaginate<T extends BaseModel>(
          dto: BasePaginationDto,
          repository: Repository<T>,
          overrideFindOptions: FindManyOptions<T> = {}, // 만약에 상위에서 사용하고 싶은 option이 있으면 덮어씌우게 만드는 것
          path: string,
     ) {
          /**
           * where__likeCount_more_than
           * 
           * where__title__ilike
           */
          const findOptions = this.composeFindOptions<T>(dto);
          const results = await repository.find({
               ...findOptions,
               ...overrideFindOptions, // 함수자체에서 override할 값들
          });

          const lastItem = results.length > 0 && results.length === dto.take ? results[results.length - 1] : null;

          const protocol = this.configService.get<string>(ENV_PROTOCOL_KEY);
          const host = this.configService.get<string>(ENV_HOST_KEY);
          const nextUrl = lastItem && new URL(`${protocol}://${host}/${path}`); // lastItem이 존재하는 경우에만 URL 가져오기
          if (nextUrl) {
               /**
                * dto의 key값들을 반복하면서 key값에 해당되는 value가 존재하면
                * param에 그대로 붙여넣는다.
                * 
                * 단, where__id_more_than 값만 lastItem의 마지막 값으로 넣어준다.
                */
               for (const key of Object.keys(dto)) { // dto의 key 값들을 반복하는 것
                    if (dto[key]) {
                         if (key !== 'where__id__more_than' && key !== 'where__id__less_than') {
                              nextUrl.searchParams.append(key, dto[key])
                         };
                    }
               }

               let key = null;
               if (dto.order__createdAt === 'ASC') {
                    key = 'where__id__more_than';
               } else {
                    key = 'where__id__less_than';
               }
               nextUrl.searchParams.append(key, lastItem.id.toString()); // where__id_more_than or where__id_less_than을 dto에 넣지 않은 경우
          }

          return {
               data: results,
               cursor: {
                    after: lastItem?.id ?? null, // lastItem이 존재하면 id로 아니면 null
               },
               count: results.length,
               next: nextUrl?.toString() ?? null, // nextUrl 존재하면 toString으로 아니면 null
          }
     }

     private composeFindOptions<T extends BaseModel>(
          dto: BasePaginationDto,
     ) : FindManyOptions<T> {
          /**
           * 반환하고 싶은 형태
           * where,
           * order,
           * take,
           * skip -> page 기반일 때만 반환
           */

          /**
           * DTO의 현재 생긴 구조는 아래와 같다
           * 
           * {
           *   where__id_more_than: 1,
           *   order__createdAt: 'ASC
           * }
           * 
           * 현재는 where__id__more_than / where__id__less_than에 해당되는 where 필터만 사용중이지만
           * 나중에 where__likeCount__more_than 이나 where__title__ilike 등 추가 필터를 넣고 싶어졌을때
           * 모든 where 필터들을 자동으로 파싱 할 수 있을만한 기능을 제작해야한다.
           * 
           * 1) where로 시작한다면 필터 로직을 적용한다.
           * 2) order로 시작한다면 정렬 로직을 적용한다.
           * 3) 필터 로직을 적용한다면 '__' 기준으로 split 했을때 3개의 값으로 나뉘는지
           *        2개의 값으로 나뉘는지 확인한다.
           *        3-1) 3개의 값으로 나뉜다면 FILTER_MAPPER에서 해당되는 operator 함수를 찾아서 적용한다.
           *             ['where', 'id', 'more_than']
           *        3-2) 2개의 값으로 나뉜다면 정확한 값을 필터하는 것이기 때문에 operator 없이 적용한다.
           *             where__id -> ['where', 'id']
           * 4) order의 경우 3-2와 같이 적용한다.
           */
          let where: FindOptionsWhere<T> = {};
          let order: FindOptionsOrder<T> = {};

          for (const [key, value] of Object.entries(dto)) { // entries를 사용하면 key, value를 가져온다
               // where__id_more_than(key): 1(value)
               if (key.startsWith('where__')) {
                    where = { // 새로 만들기
                         ...where, // 기존에 있던 where
                         ...this.parseWhereFilter(key, value), // key, value를 이용해서 계속해서 추가
                    }
               } else if (key.startsWith('order__')) {
                    order = { // 새로 만들기
                         ...order, // 기존에 있던 order
                         ...this.parseWhereFilter(key, value),
                    }
               }
          }

          return {
               // 반환형태
               where,
               order,
               take: dto.take,
               skip: dto.page ? dto.take * (dto.page - 1) : null, // 없는 경우 cursor 기반 페이지네이션 따라서 skip 필요 없음
          };
     }

     // value가 any인 이유: validator를 통과하면 실제 값이 어떤 것인지 알 수 없기 때문에
     private parseWhereFilter<T extends BaseModel>(key: string, value: any): 
          FindOptionsWhere<T> | FindOptionsOrder<T> { 
          const options: FindOptionsWhere<T> = {};

          const split = key.split('__'); // where__id__more_than -> ['where', 'id', 'more_than']
          if (split.length !== 2 && split.length !== 3) 
               throw new BadRequestException(`where 필터는 '__'로 split 했을때 길이가 2 또는 3 이어야합니다. - 문제되는 키값 ${key}`);
          /**
           * 길이가 2인 경우는 where__id = 3
           * FindOptionsWhere로 풀어보면 아래와 같다
           * 
           * {
           *   where: {
           *        id: 3
           *   }
           * }
           */
          if (split.length === 2) {
               const [_, field] = split; // ['where', 'id']
               /**
                * field -> 'id' / value -> 3
                * 형태
                * {
                *   id: 3,
                * }
                */
               options[field] = value;
          } else {
               /**
                * 길이가 3일 경우에는 TypeORM 유틸리티 적용이 필요한 경우다.
                * 
                * where__id__more_than의 경우
                * where는 버려도 되고 두번째 값은 필터할 키값이 되고
                * 세번쨰 값은 typeORM 유틸리티가 된다.
                * 
                * FILTER_MAPPER에 미리 정의해둔 값들로
                * field 값에 FILTER_MAPPER에서 해당되는 utility를 가져온 후 값에 적용 해준다.
                */
               const [_, field, operator] = split; // ['where', 'id', 'more_than']

               // where__id__between = 3,4
               // 만약에 split 대상 문자가 존재하지 않으면 길이가 무조건 1이다.
               //const values = value.toString().split(',');

               // field -> id
               // operator -> more_than
               // FILTER_MAPPER[operator] -> MoreThan
               // if (operator === 'between') { // between같은 경우 2개의 값을 받는다.
               //      options[field] = FILTER_MAPPER[operator](values[0], values[1]);
               // } else {
               //      

               if (operator === 'i_like'){
                    options[field] = FILTER_MAPPER[operator](`%${value}%`)
               }else{
                    options[field] = FILTER_MAPPER[operator](value);
               }
          }
          return options;
     }

     // private parseOrderFilter<T extends BaseModel>(key: string, value: any): 
     //      FindOptionsOrder<T>{ 
     //      const order: FindOptionsOrder<T> = {};
     //      /**
     //       * order는 무조건 2개로 split
     //       */
     //      const split = key.split('__');
     //      if (split.length !== 2) {
     //           throw new BadRequestException(
     //                `order 필터는 '__'로 split 했을 때 길이가 2여야 합니다. - 문제되는 키값 : ${key}`,
     //           );
     //      }
     //      const [_, field] = split;
     //      order[field] = value;
     //      return order;
     // }
}
