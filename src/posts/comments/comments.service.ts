import { DEFAULT_COMMENT_FIND_OPTIONS } from './const/default-comments-find-options.const';
import { DEFAULT_POST_AND_OPTIONS } from './../const/default-post-find-options.const';
import { BadRequestException, Injectable } from '@nestjs/common';
import { CommonService } from 'src/common/common.service';
import { PaginateCommentsDto } from './dto/paginate-comments.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { CommentsModel } from './entity/comments.entity';
import { QueryRunner, Repository } from 'typeorm';
import { CreateCommentsDto } from './dto/create-comments.dto';
import { UsersModel } from 'src/users/entity/users.entity';
import { UpdateCommentsDto } from './dto/update-comments-dto';

@Injectable()
export class CommentsService {

     constructor(
          @InjectRepository(CommentsModel)
          private readonly commentsRepository: Repository<CommentsModel>,
          private readonly commonService: CommonService,
     ) {}

     getRepository(qr?: QueryRunner) {
          return qr ? qr.manager.getRepository<CommentsModel>(CommentsModel) : this.commentsRepository;
     }



     paginateComments(
          dto: PaginateCommentsDto,
          postId: number,
     ) {
          return this.commonService.paginate(
               dto,
               this.commentsRepository,
               {
                    ...DEFAULT_COMMENT_FIND_OPTIONS,
                    where: {
                         post: {
                              id: postId,
                         }
                    },
               },
               `posts/${postId}/comments`,
          );
     }

     async getCommentById(id: number) {
          const comment = await this.commentsRepository.findOne({
               ...DEFAULT_COMMENT_FIND_OPTIONS,
               where: {
                    id,
               }
          });
          if (!comment) throw new BadRequestException(`id: ${id} Comment는 존재하지 않습니다. `);
          return comment;
     }

     async createComment(
          dto: CreateCommentsDto,
          postId: number,
          author: UsersModel, // AccessToken에서 넘겨주면 UsersModel이 들어있음
          qr?: QueryRunner,
     ) {
          const repository = this.getRepository(qr);
          return repository.save({
               ...dto,
               post: {
                    id: postId
               },
               author,
          });
     }

     async updateComment(
          dto: UpdateCommentsDto,
          commentId: number,
     ) {
          const comment = await this.commentsRepository.findOne({
               where: {
                    id: commentId
               }
          });
          if (!comment) throw new BadRequestException(`존재하지 않는 댓글입니다. `);

          // preload 기능
          const prevComment = await this.commentsRepository.preload({
               id: commentId, // id 기반의 commentId 들어오게 됨
               ...dto, // 나머지는 dto내용으로 변경
          });

          const newComment = await this.commentsRepository.save(
               prevComment,
          );

          return newComment;
     }

     async deleteComment(
          id: number,
          qr?: QueryRunner
     ) {
          const repository = this.getRepository(qr);
          const comment = await repository.findOne({
               where: {
                    id,
               }
          });
          if (!comment) throw new BadRequestException(`존재하지 않는 댓글입니다. `);
          await repository.delete(id);
          return id;
     }

     async isCommentMine(userId: number, commentId: number) {
          return this.commentsRepository.exists({
               where: {
                    id: commentId,
                    author: {
                         id: userId,
                    }
               },
               relations: {
                    author: true,
               }
          });
     }
}
