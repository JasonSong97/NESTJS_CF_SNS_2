import { CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

// abstract를 사용하는 이유는 이 클래스만 사용하지 않기 떄문에
export abstract class BaseModel {

     @PrimaryGeneratedColumn() // PK 이면서 자동증가전략
     id: number;

     @UpdateDateColumn() // 업데이트시 알아서 찍힘
     updatedAt: Date; // typeORM에서 지원하는 기능

     @CreateDateColumn()
     createdAt: Date;
}