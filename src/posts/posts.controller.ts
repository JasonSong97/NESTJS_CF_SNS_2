import { Body, Controller, Delete, Get, NotFoundException, Param, ParseIntPipe, Post, Put, UseGuards, Request, Patch, Query, UseInterceptors, UploadedFile, InternalServerErrorException, UseFilters, BadRequestException } from '@nestjs/common';
import { PostsService } from './posts.service';
import { AccessTokenGuard } from 'src/auth/guard/bearer-token.guard';
import { User } from 'src/users/decorator/user.decorator';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PaginatePostDto } from './dto/paginate-post.dto';
import { UsersModel } from 'src/users/entity/users.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImageModelType } from 'src/common/entity/image.entity';
import { DataSource, QueryRunner as QR } from 'typeorm';
import { PostsImagesService } from './image/images.service';
import { LogInterceptor } from 'src/common/interceptor/log.interceptor';
import { TransactionInterceptor } from 'src/common/interceptor/transaction.interceptor';
import { QueryRunner } from 'src/common/decorator/query-runner.decorator';
import { HttpExceptionFilter } from 'src/common/exception-filter/http-exception-filter';
import { Roles } from 'src/users/decorator/roles.decorator';
import { RolesEnum } from 'src/users/const/roles.const';
import { IsPublic } from 'src/common/decorator/is-public.decorator';
import { IsPostMineOrAdminGuard } from './guard/is-post-mine-or-admin.guard';


@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly postsImagesService: PostsImagesService,
    private readonly dataSource: DataSource,
  ) {}

  @Get()
  //@UseInterceptors(LogInterceptor)
  //@UseFilters(HttpExceptionFilter)
  @IsPublic()
  getPosts(
    @Query() query: PaginatePostDto,
  ) {
    //throw new BadRequestException('에러 테스트'); // HttpExceptionFilter 테스트
    return this.postsService.paginatePosts(query);
  }

  @Post('random')
  async postPostsRandom(
    @User() user: UsersModel
  ) {
    await this.postsService.generatePosts(user.id);
    return true;
  }

  @Get(':id')
  @IsPublic()
  getPost(@Param('id', ParseIntPipe) id: number) { // url의 id 부분만 가져오고 변수 id에 넣는다.
    return this.postsService.getPostById(id);
  }

  /**
   * Transaction
   * 
   * A model, B model
   * Post API -> A 모델을 저장하고, B 모델을 저장한다.
   * await repository.save(a);
   * await repository.save(b);
   * 
   * 만약에 a를 저장하다가 실패하면 b를 저장하면 안될경우
   * all or nothing
   * 
   * transaction
   * start -> 시작 (실행하는 모든 기능은 transaction에 묶인다)
   * commit -> 저장 (한번에 저장이 된다.)
   * rollback -> 원상복구 (start를 하고 commit 전까지 문제가 발생하면 원상복구를 한다.)
   */
  @Post()
  @UseInterceptors(TransactionInterceptor)
  //@UseInterceptors(FileInterceptor('image')) // 파일을 업로드할 필드의 이름 -> image라는 키값에 넣어서 보냄
  async postPosts(
    @User('id') userId: number, // <- @Request() req: any <- @Body('authorId') authorId: number,
    @Body() body: CreatePostDto,
    @QueryRunner() queryRunner: QR,
    //@UploadedFile() file?: Express.Multer.File,
  ) {
    // 현재 image없이 post만 생성된 상태
    const post = await this.postsService.createPost( 
      userId, body, queryRunner, // file?.filename, // filename은 file이 null이 아닌 경우에만 들어올 수 있으니까
    );

    // 루핑하면서 image 생성 -> 동시에 post와 연동된다.
    for (let i = 0; i < body.images.length; i++) {
      await this.postsImagesService.createPostImage({
        post,
        order: i,
        path: body.images[i],
        type: ImageModelType.POST_IMAGE,
      }, queryRunner); // temp -> posts
    }

    return this.postsService.getPostById(post.id, queryRunner);
  }

  @Patch(':postId')
  @UseGuards(IsPostMineOrAdminGuard)
  patchPost(
    @Param('postId', ParseIntPipe) id: number,  
    @Body() body: UpdatePostDto,
  ) {
    return this.postsService.updatePost(id, body);
  }

  @Delete(':id')
  @Roles(RolesEnum.ADMIN) // admin만 접근 가능
  deletePost(
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.postsService.deletePost(id);
  }
}