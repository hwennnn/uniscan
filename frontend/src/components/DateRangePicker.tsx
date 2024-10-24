import React, { useMemo, useState } from "react";

interface DateRangePickerProps {
  onDateRangeChange: (dateRange: [number, number] | null) => void;
}

/**
 * DateRangePicker component allows users to select a start and end date.
 * It validates the date range and triggers the `onDateRangeChange` callback with the selected date range in milliseconds.
 *
 * @component
 * @param {Object} props - The component props.
 * @param {(dateRange: [number, number] | null) => void} props.onDateRangeChange - Callback function to handle the date range change.
 *
 * @example
 * <DateRangePicker onDateRangeChange={(dateRange) => console.log(dateRange)} />
 *
 * @returns {JSX.Element} The rendered DateRangePicker component.
 */
const DateRangePicker: React.FC<DateRangePickerProps> = ({
  onDateRangeChange,
}: DateRangePickerProps): JSX.Element => {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  const handleStartDateChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const date = event.target.value ? new Date(event.target.value) : null;
    setStartDate(date);
  };

  const handleEndDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const date = event.target.value ? new Date(event.target.value) : null;
    setEndDate(date);
  };

  /**
   * Handles the form submission for the date range picker.
   *
   * @param {React.FormEvent} event - The form submission event.
   *
   * This function prevents the default form submission behavior and checks if the start or end date is null.
   * If either date is null, it calls `onDateRangeChange` with `null` and returns.
   *
   * It then calculates the start and end dates in milliseconds, setting the start date to the beginning of the day
   * and the end date to the end of the day. If the end date is today, it adjusts the end time to the current time.
   *
   * If the start date is after the end date, the function returns without making any changes.
   *
   * Finally, it calls `onDateRangeChange` with the calculated start and end dates in milliseconds.
   */
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (startDate === null || endDate === null) {
      onDateRangeChange(null);
      return;
    }

    const startInMs = new Date(
      new Date(startDate).setHours(0, 0, 0, 0)
    ).getTime();
    let endInMs = new Date(
      new Date(endDate).setHours(23, 59, 59, 999)
    ).getTime();
    if (endDate.toISOString().split("T")[0] === today) {
      const currentTime = new Date().getTime();
      endInMs = Math.min(currentTime, endInMs);
    }

    if (startInMs > endInMs) {
      return;
    }

    onDateRangeChange([startInMs, endInMs]);
  };

  return (
    <form
      className="flex flex-col gap-2 p-2 rounded-lg border border-gray-300 bg-gray-50 max-w-80 mx-auto mt-4"
      onSubmit={handleSubmit}
    >
      <div className="flex gap-2 justify-between">
        {/* Start Date */}
        <label className="text-sm font-medium text-gray-700 flex flex-col">
          Start Date:{" "}
          <input
            type="date"
            value={startDate ? startDate.toISOString().split("T")[0] : ""}
            onChange={handleStartDateChange}
            max={today}
            className="p-1 rounded-md border border-gray-300 text-sm text-gray-700"
          />
        </label>
        {/* End Date */}
        <label className="text-sm font-medium text-gray-700 flex flex-col">
          End Date:{" "}
          <input
            type="date"
            value={endDate ? endDate.toISOString().split("T")[0] : ""}
            onChange={handleEndDateChange}
            max={today}
            className="p-1 rounded-md border border-gray-300 text-sm text-gray-700"
          />
        </label>
      </div>
      {/* Submit button */}
      <button
        type="submit"
        className="p-1 rounded-md bg-blue-500 text-white text-sm font-medium cursor-pointer border-none transition-colors duration-200 hover:bg-blue-600"
      >
        Submit
      </button>
    </form>
  );
};

export default DateRangePicker;
