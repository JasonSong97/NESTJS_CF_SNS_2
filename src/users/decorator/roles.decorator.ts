import { SetMetadata } from "@nestjs/common";
import { RolesEnum } from "../const/roles.const";

export const ROLES_KEY = 'user_roles';

// @Roles(RolesEnum.ADMIN) -> admin 사용자만 사용 가능
export const Roles = (role: RolesEnum) => SetMetadata(ROLES_KEY, role) // 키값과 키값에 해당하는 데이터 넣기