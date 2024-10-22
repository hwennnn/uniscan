import Dashboard from "./components/Dashboard";
import SearchInput from "./components/SearchInput";
import TransactionsTable from "./components/TransactionsTable";

const MainScreen = () => {
  return (
    <>
      <Dashboard />
      <SearchInput />
      <TransactionsTable />
    </>
  );
};

export default MainScreen;
