import { FindManyOptions } from "typeorm";
import { PostsModel } from "../entity/posts.entity";

export const DEFAULT_POST_AND_OPTIONS: FindManyOptions<PostsModel> = {
     // relations: [
     //      'author', 
     //      'images'
     // ] OR
     relations: {
          author: true,
          images: true,
     }
}