import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CurrencyConvertDto {
  @IsNotEmpty()
  @IsNumber()
  amount: number;
}
