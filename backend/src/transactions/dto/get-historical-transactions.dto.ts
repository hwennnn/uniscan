import {
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  Validate,
} from 'class-validator';
import { ValidDateRange } from 'src/transactions/decorators/valid-date-range';

export class GetHistoricalTransactionsDto {
  @IsNotEmpty()
  @IsNumberString()
  dateFrom: string;

  @IsNotEmpty()
  @IsNumberString()
  @Validate(ValidDateRange)
  dateTo: string;

  @IsOptional()
  @IsNumberString()
  offset?: number;

  @IsOptional()
  @IsNumberString()
  page?: number;
}
