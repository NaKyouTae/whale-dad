import { ApiProperty } from "@nestjs/swagger";
import { IsString, Matches, MaxLength, MinLength } from "class-validator";

export class SignUpDto {
  @ApiProperty({ example: "whaledad", description: "로그인 계정 = 화면에 보이는 이름" })
  @IsString()
  @MinLength(2, { message: "계정은 2자 이상이어야 해요" })
  @MaxLength(20, { message: "계정은 20자 이하여야 해요" })
  @Matches(/^[a-zA-Z0-9가-힣_-]+$/, {
    message: "계정은 한글, 영문, 숫자, - _ 만 쓸 수 있어요",
  })
  username!: string;

  @ApiProperty({ example: "비밀번호1234" })
  @IsString()
  @MinLength(4, { message: "비밀번호는 4자 이상이어야 해요" })
  @MaxLength(72, { message: "비밀번호는 72자 이하여야 해요" })
  password!: string;
}

export class SignInDto {
  @ApiProperty({ example: "whaledad" })
  @IsString()
  @MaxLength(20)
  username!: string;

  @ApiProperty({ example: "비밀번호1234" })
  @IsString()
  @MaxLength(72)
  password!: string;
}
