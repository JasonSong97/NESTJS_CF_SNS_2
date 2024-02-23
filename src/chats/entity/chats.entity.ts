import { BaseModel } from "src/common/entity/base.entity";
import { UsersModel } from "src/users/entity/users.entity";
import { Entity, JoinTable, ManyToMany, OneToMany } from "typeorm";
import { MessagesModel } from "../messages/entity/messages.entity";

@Entity()
export class ChatsModel extends BaseModel {

     // 1명의 사용자는 N개의 채팅방에 들어간다.
     // 1개의 채팅방은 여러 사용자가 있다.
     @ManyToMany(() => UsersModel, (user) => user.chats)
     @JoinTable()
     users: UsersModel[];

     @OneToMany(() => MessagesModel, (message) => message.chat)
     messages: MessagesModel;
}