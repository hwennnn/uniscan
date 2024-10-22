import Dashboard from "./components/Dashboard";
import DateRangePicker from "./components/DateRangePicker";
import SearchInput from "./components/SearchInput";
import TransactionsTable from "./components/TransactionsTable";

const MainScreen = () => {
  return (
    <>
      <Dashboard />
      <SearchInput />
      <DateRangePicker onDateRangeChange={() => {}} />
      <TransactionsTable />
    </>
  );
};

export default MainScreen;
