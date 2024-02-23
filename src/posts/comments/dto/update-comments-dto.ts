import { PartialType } from "@nestjs/mapped-types";
import { CreateCommentsDto } from "./create-comments.dto";

// CreateCommentsDto의 부분 상속
export class UpdateCommentsDto extends PartialType(CreateCommentsDto) {}