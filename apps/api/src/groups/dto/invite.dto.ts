import { ArrayMaxSize, IsArray, IsString } from 'class-validator';

export class InviteDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(50)
  userIds: string[];
}
