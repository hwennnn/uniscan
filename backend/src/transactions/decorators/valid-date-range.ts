import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * @file ValidDateRange decorator for validating date ranges.
 *
 * @description
 * This decorator validates that a given date range is valid. Specifically, it ensures that:
 * - The `dateTo` value is not greater than the current time.
 * - The `dateFrom` value is smaller than the `dateTo` value.
 */
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

  defaultMessage(_args: ValidationArguments) {
    return `The date range is invalid: dateFrom must be smaller than dateTo, and dateTo cannot be greater than the current time.`;
  }
}
