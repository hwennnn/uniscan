import {
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  Validate,
} from 'class-validator';
import { ValidDateRange } from '../decorators/valid-date-range';
import { ValidNumberRangeValue } from '../decorators/valid-number-range-value';

export class GetHistoricalTransactionsByDatesDto {
  @IsNotEmpty()
  @IsNumberString()
  dateFrom: string;

  @IsNotEmpty()
  @IsNumberString()
  @Validate(ValidDateRange)
  dateTo: string;
}

export class GetHistoricaBatchTransactionsDto {
  @IsOptional()
  @IsNumberString()
  offset?: number;

  @IsOptional()
  @IsNumberString()
  @Validate(ValidNumberRangeValue, [10, 50])
  take?: number;
}
