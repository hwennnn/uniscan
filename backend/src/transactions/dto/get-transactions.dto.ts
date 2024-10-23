import {
  IsNumberString,
  IsOptional,
  IsString,
  Validate,
} from 'class-validator';
import { ValidNumberRangeValue } from '../decorators/valid-number-range-value';

export class GetTransactionsDto {
  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @IsNumberString()
  offset?: number;

  @IsOptional()
  @IsNumberString()
  @Validate(ValidNumberRangeValue, [10, 50])
  take?: number;
}
