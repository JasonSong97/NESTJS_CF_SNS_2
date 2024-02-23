import { ValidationArguments } from "class-validator";

export const emailValidationMessage = (args: ValidationArguments) => {
     /**
     * ValidationArguments의 프로퍼티
     * 
     * 1) value - 검증 되고 있는 값 (실제 입력된 값)
     * 2) constraints - 파라미터에 입력된 제한 사항들
     *    length의 경우 constraints가 2개: [1, 20]
     *    args.constraints[0] = 1, args.constraints[1] = 20 
     * 3) targetName - 검증하고 있는 클래스의 이름
     *    UsersModel
     * 4) object - 검증하고 있는 객체(잘 사용 안함)
     * 5) property - 검증 되고 있는 객체의 프로퍼티 이름
     *    nickname, email etc..
     */
     return `${args.property}에 정확한 이메일을 입력해주세요!`;
}