import { BadRequestException, Injectable, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";
import { PostsService } from "src/posts/posts.service";

@Injectable()
export class PostExistsMiddleware implements NestMiddleware {

     constructor(
          private readonly postService: PostsService, 
     ) {}

     async use(req: Request, res: Response, next: NextFunction) {
          const postId = req.params.postId; // path parameter 안의 postId를 가져올 수 있습니다.
          if (!postId) throw new BadRequestException(`Post ID 파라미터는 필수입니다. `);
          const exists = await this.postService.checkPostExistsById(
               parseInt(postId),
          );
          if (!exists) throw new BadRequestException(`Post가 존재하지 않습니다. `);
          next(); // next를 해줘야 다음단계로 이동
     }
}