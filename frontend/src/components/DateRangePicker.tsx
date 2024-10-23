import React, { useState } from "react";

interface DateRangePickerProps {
  onDateRangeChange: (dateRange: [number, number] | null) => void;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  onDateRangeChange,
}) => {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

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

  const today = new Date().toISOString().split("T")[0];

  return (
    <form
      className="flex flex-col gap-2 p-2 rounded-lg border border-gray-300 bg-gray-50 max-w-80 mx-auto mt-4"
      onSubmit={handleSubmit}
    >
      <div className="flex gap-2 justify-between">
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
