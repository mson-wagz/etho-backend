import { IsNotEmpty, IsString, Length } from 'class-validator';

export class CurrencyQueryDto {
  @IsNotEmpty()
  @IsString()
  @Length(3, 3)
  from: string;

  @IsNotEmpty()
  @IsString()
  @Length(3, 3)
  to: string;
}
