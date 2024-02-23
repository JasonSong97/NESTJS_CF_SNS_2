import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UsersModel } from './entity/users.entity';
import { QueryRunner, Repository } from 'typeorm';
import { UserFollowersModel } from './entity/user-followers.entity';

@Injectable()
export class UsersService {

     constructor(
          @InjectRepository(UsersModel)
          private readonly usersRepository: Repository<UsersModel>,
          @InjectRepository(UserFollowersModel)
          private readonly userFollowersRepository: Repository<UserFollowersModel>,
     ) {}

     getUsersRepository(qr?: QueryRunner) {
          // qr 있는 경우
          return qr ? qr.manager.getRepository<UsersModel>(UsersModel) : this.usersRepository;
     }
     getUsersFollowRepository(qr?: QueryRunner) {
          // qr 있는 경우
          return qr ? qr.manager.getRepository<UserFollowersModel>(UserFollowersModel) : this.userFollowersRepository;
     }

     async createUser(user: Pick<UsersModel, 'email' | 'nickname' | 'password'>) {
          // 1) nickname 중복이 없는지 확인
          //   exist() -> 만약에 조건에 해당되는 값이 있으면 true
          const nicknameExists = await this.usersRepository.exists({
               where: {
                    nickname: user.nickname,
               },
          });
          if (nicknameExists) throw new BadRequestException('이미 존재하는 nickname 입니다.!')
          const emailExists = await this.usersRepository.exists({
               where: {
                    email: user.email,
               },
          });
          if (emailExists) throw new BadRequestException('이미 가입한 email 입니다.!')

          const userObject = this.usersRepository.create({
               // Object 형태로 넣기
               nickname: user.nickname,
               email: user.email,
               password: user.password,
          });
          const newUser = await this.usersRepository.save(userObject);
          return newUser;
     }

     async getAllUsers() {
          return await this.usersRepository.find();
     }

     async getUserByEmail(email: string) {
          return this.usersRepository.findOne({
               where: {
                    email,
               },
          });
     }

     async followUser(followerId: number, followeeId: number, qr?: QueryRunner) {
          const userFollowersRepository = this.getUsersFollowRepository(qr);
          await userFollowersRepository.save({
               follower: {
                    id: followerId
               },
               followee: {
                    id: followeeId
               }
          });

          return true;
     }

     async getFollowers(userId: number, includeNotConfirmed: boolean) {
          const where = {
               // 팔로우하는 대상
               followee: {
                    id: userId
               }
          };

          // 허가 한것들만 추가를 해라!
          if (!includeNotConfirmed) {
               where['isConfirmed'] = true;
          }

          const result = await this.userFollowersRepository.find({
               where,
               relations: {
                    follower: true,
                    followee: true
               }
          });
          return result.map((x) => ({
               id: x.follower.id,
               nickname: x.follower.nickname,
               email: x.follower.email,
               isConfirmed: x.isConfirmed,
          })); // follower만 뽑아서 리스트만들기
     }

     async confirmFollow(followerId: number, followeeId: number, qr?: QueryRunner) {
          const userFollowersRepository = this.getUsersFollowRepository(qr);

          // 중간테이블에 데이터가 존재하는지 확인
          const existing = await userFollowersRepository.findOne({
               where: {
                    follower: {
                         id: followerId
                    },
                    followee: {
                         id: followeeId
                    }
               },
               relations: {
                    follower: true,
                    followee: true
               },
          });
          if (!existing) throw new BadRequestException(`존재하지 않는 팔로우 요청입니다. `);

          // save값을 넣으면, 변경된 부분만 update한다.
          await userFollowersRepository.save({
               ...existing,
               isConfirmed: true,
          });
          return true;
     }

     async deleteFollow(followerId: number, followeeId: number, qr?: QueryRunner) {
          const userFollowersRepository = this.getUsersFollowRepository(qr);
          await userFollowersRepository.delete({
               follower: {
                    id: followerId,
               },
               followee: {
                    id: followeeId,
               },
          });
          return true;
     }

     async incrementFollowerCount(userId: number, qr?: QueryRunner) {
          const userRepository = this.getUsersRepository(qr);
          await userRepository.increment({
               id: userId
          }, 'followerCount', 1);
     }

     async decrementFollowerCount(userId: number, qr?: QueryRunner) {
          const userRepository = this.getUsersRepository(qr);
          await userRepository.decrement({
               id: userId
          }, 'followerCount', 1);
     }
 }
