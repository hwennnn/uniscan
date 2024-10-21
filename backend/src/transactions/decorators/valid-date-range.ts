import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

// Custom constraint for date range validation
@ValidatorConstraint({ name: 'dateRange', async: false })
export class ValidDateRange implements ValidatorConstraintInterface {
  validate(value: string | number, args: ValidationArguments) {
    const obj = args.object as any;

    const dateFrom = new Date(+obj.dateFrom);
    const dateTo = new Date(+value);

    // Ensure both are valid dates
    if (isNaN(dateFrom.getTime()) || isNaN(dateTo.getTime())) {
      return false;
    }

    // Rule 1: dateTo cannot be greater than the current time
    if (dateTo.getTime() > Date.now()) {
      return false;
    }

    // Rule 2: dateFrom must be smaller than dateTo
    if (dateFrom.getTime() >= dateTo.getTime()) {
      return false;
    }

    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return `The date range is invalid: dateFrom must be smaller than dateTo, and dateTo cannot be greater than the current time.`;
  }
}
