import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { FindOptionsWhere, LessThan, MoreThan, QueryRunner, Repository } from 'typeorm';
import { PostsModel } from './entity/posts.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PaginatePostDto } from './dto/paginate-post.dto';
import { URL } from 'url';
import { CommonService } from 'src/common/common.service';
import { ConfigService } from '@nestjs/config';
import { ENV_HOST_KEY, ENV_PROTOCOL_KEY } from 'src/common/const/env-keys.const';
import { basename, join } from 'path';
import { POST_IMAGE_PATH, PUBLIC_FOLDER_PATH, TEMP_FOLDER_PATH } from 'src/common/const/path.const';
import { promises } from 'fs'; // fs: file system
import { CreatePostImageDto } from './image/dto/create-image.dto';
import { ImageModel } from 'src/common/entity/image.entity';
import { DEFAULT_POST_AND_OPTIONS } from './const/default-post-find-options.const';

@Injectable()
export class PostsService {

     constructor(
          @InjectRepository(PostsModel) // TypeORM으로 주입되는 Repository라는 명시
          private readonly postsRepository: Repository<PostsModel>,
          @InjectRepository(ImageModel) // TypeORM으로 주입되는 Repository라는 명시
          private readonly imageRepository: Repository<ImageModel>,
          private readonly commonService: CommonService,
          private readonly configService: ConfigService,
     ) {}

     async getAllPosts() {
          return await this.postsRepository.find({
               ...DEFAULT_POST_AND_OPTIONS,
          });
     }

     async generatePosts(userId: number) {
          for(let i = 0; i < 100; i++) {
               await this.createPost(userId, {
                    title: `임의로 생성된 ${i}`,
                    content: `임의로 생성된 포수트 내용 ${i}`,
                    images: [],
               });
          }
     }

     // 1) 오름차 순으로 정렬하는 페이지네이션만 구현
     async paginatePosts(dto: PaginatePostDto) {
          return this.commonService.paginate(
               dto,
               this.postsRepository,
               {
                    // relations: ['author', 'images'] // post를 가져올 때 작성자 정보까지 같이 가져오기
                    ...DEFAULT_POST_AND_OPTIONS
               },
               'posts'
          );
          // if (dto.page) return this.pagePaginatePosts(dto);
          // else return this.cursorPaginatePosts(dto);
     }

     async pagePaginatePosts(dto: PaginatePostDto) {
          /**
           * data: Data[],
           * total: number
           * 
           * [1] [2] [3] [4]
           */
          const [posts, count] = await this.postsRepository.findAndCount({
               skip: dto.take * (dto.page - 1),
               take: dto.take,
               order: {
                    createdAt: dto.order__createdAt,
               }
          });

          return {
               data: posts,
               total: count
          }
     }

     async cursorPaginatePosts(dto: PaginatePostDto) {
          // GoToDefinition: find -> FindManyOptions -> FindOneOptions -> where? 찾기
          const where: FindOptionsWhere<PostsModel> = {};

          /**
           * {
           *   id: id: LessThan(dto.where__id_less_than)
           * }
           */
          if (dto.where__id__less_than) {
               where.id = LessThan(dto.where__id__less_than);
          } else if(dto.where__id__more_than) {
               where.id = MoreThan(dto.where__id__more_than);
          }

          // 1, 2, 3, 4, 5
          const posts = await this.postsRepository.find({
               where,
               // order__createdAt
               order: {
                    createdAt: dto.order__createdAt,
               },
               take: dto.take,
          });

          // 해당되는 post가 0개 이상이면
          // 마지막 post를 가져오고
          // 아니면 null을 반환한다.
          const lastItem = posts.length > 0 && posts.length === dto.take ? posts[posts.length - 1] : null;

          const protocol = this.configService.get<string>(ENV_PROTOCOL_KEY);
          const host = this.configService.get<string>(ENV_HOST_KEY);
          const nextUrl = lastItem && new URL(`${protocol}://${host}/posts`); // lastItem이 존재하는 경우에만 URL 가져오기
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
               if (dto.order__createdAt === 'ASC') key = 'where__id__more_than';
               else key = 'where__id__less_than';

               nextUrl.searchParams.append(key, lastItem.id.toString()); // where__id_more_than or where__id_less_than을 dto에 넣지 않은 경우
          }


          /**
           * Response
           * 
           * data: Data[],
           * cursor: {
           *   after: 마지막 Data의 Id
           * },
           * count: 응답한 데이터의 갯수
           * next: 다음 요청을 할때 사용할 URL
           */
          return {
               data: posts,
               cursor: {
                    after: lastItem?.id ?? null, // ?는 null까지 받는 것
               },
               count: posts.length,
               next: nextUrl?.toString() ?? null
          }
     }

     async getPostById(id: number, queryRunner?: QueryRunner) {
          const repository = this.getRepository(queryRunner);
          const post = await repository.findOne({
               ...DEFAULT_POST_AND_OPTIONS,
               where: {
                    id,
               }
          });
          if (!post) throw new NotFoundException();
          return post;
     }

     getRepository(queryRunner?: QueryRunner) {
          // queryRunner가 있는 경우에는 queryRunner 저장소만 사용
          // 아니면 주입받은 저장소 사용
          return queryRunner ? queryRunner.manager.getRepository<PostsModel>(PostsModel) : this.postsRepository;
     }

     async incrementCommentCount(postId: number, qr?: QueryRunner) {
          const repository = this.getRepository(qr);
          await repository.increment({
               id: postId,
          }, 'commentCount', 1);
     }

     async decrementCommentCount(postId: number, qr?: QueryRunner) {
          const repository = this.getRepository(qr);
          await repository.decrement({
               id: postId,
          }, 'commentCount', 1);
     }

     async createPost(authorId: number, postDto: CreatePostDto, queryRunner?: QueryRunner) { // (image?: string) 기존에 존재
          // 1) create -> 저장할 객체를 생성한다. -> 저장할 객체를 생성하는 것이기 때문에 동기
          // 2) save -> 객체를 저장한다. (create 메소드에서 생성한 객체로) -> 비동기
          const repository = this.getRepository(queryRunner);

          const post = repository.create({
               // Object
               author: {
                    id: authorId,
               },
               ...postDto, // 스프레드문법
               images: [], // createPostImage()를 실행하면 post를 생성하고 image가 생성되면서 자동으로 연결이 된다.
               likeCount: 0,
               commentCount: 0,
          });

          // post는 id가 없다. newPost는 id가 있다.
          const newPost = await repository.save(post);
          return newPost;
     }

     async updatePost(postId: number, postDto: UpdatePostDto) {
          const { title, content } = postDto;
          // save 기능
          // 1) 만약에 데이터자 존재하지 않으면, (id 기준으로) 새로 생성한다.
          // 2) 만약에 데이터가 존재한다면 (같은 id의 값이 존재한다면) 존재하던 값을 업데이트 한다.
          const post = await this.postsRepository.findOne({
               where: {
                    id: postId,
               },
          });
          if (!post) throw new NotFoundException();
          if (title) post.title = title;
          if (content) post.content = content;

          const newPost = await this.postsRepository.save(post); // 여기서는 update를 한다.
          return newPost;
     }

     async deletePost(postId: number) {
          const post = await this.postsRepository.findOne({
               where: {
                    id: postId,
               },
          });
          if (!post) throw new NotFoundException();
          await this.postsRepository.delete(postId);
          return postId;
     }

     async checkPostExistsById(id: number) {
          return this.postsRepository.exists({
               where: {
                    id,
               },
          })
     }

     async isPostMine(userId: number, postId: number) {
          return this.postsRepository.exists({
               where: {
                    id: postId,
                    author: {
                         id: userId,
                    }
               },
               relations: {
                    author: true,
               }
          })
     }
}
