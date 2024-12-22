import Dashboard from "./components/Dashboard";
import SearchInput from "./components/SearchInput";
import TransactionsTable from "./components/TransactionsTable";
import { APIProvider } from "./core/common/api-provider";

function App() {
  return (
    <APIProvider>
      <Dashboard />
      <SearchInput />
      <TransactionsTable />
    </APIProvider>
  );
}

export default App;
