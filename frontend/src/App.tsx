import Dashboard from "./components/Dashboard";
import TransactionsTable from "./components/TransactionsTable";
import { APIProvider } from "./core/common/api-provider";

function App() {
  return (
    <APIProvider>
      <Dashboard />
      <TransactionsTable />
    </APIProvider>
  );
}

export default App;
