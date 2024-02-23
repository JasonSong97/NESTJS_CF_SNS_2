import { join } from "path";

// 서버 프로젝트의 루트 폴더
// /Users/asdqewdsadad/asdasd/bfgb/DF_SNS_2
export const PROJECT_ROOT_PATH = process.cwd(); // current working directory 약자
// 외부에서 접근 가능한 파일들을 모아둔 폴더 이름
export const PUBLIC_FOLDER_NAME = 'public';
// 포스트 이미지들을 저장할 폴더 이름
export const POSTS_FOLDER_NAME = 'posts';
// 임시 폴더 이름
export const TEMP_FOLDER_NAME = 'temp';

// 실제 공개폴더의 절대경로
// /{프로젝트의 위치}/public
export const PUBLIC_FOLDER_PATH = join( // 경로를 만들어 주는 함수
     // string을 무한히 넣을 수 있다.
     PROJECT_ROOT_PATH,
     PUBLIC_FOLDER_NAME
)

// 포스트 이미지를 저장할 폴더
// /{프로젝트의 위치}/public/posts
export const POST_IMAGE_PATH = join(
     PUBLIC_FOLDER_PATH,
     POSTS_FOLDER_NAME,
)

// 절대경로 x
// http://localhost:3000 + /public/posts/xxx.png
export const POST_PUBLIC_IMAGE_PATH = join(
     PUBLIC_FOLDER_NAME,
     POSTS_FOLDER_NAME,
)

// 임시 파일들을 저장할 폴더
// {프로젝트경로}/temp
export const TEMP_FOLDER_PATH = join(
     PUBLIC_FOLDER_PATH,
     TEMP_FOLDER_NAME,
)