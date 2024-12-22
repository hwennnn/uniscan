import Dashboard from "./components/Dashboard";
import SearchInput from "./components/SearchInput";
import TransactionsTable from "./components/TransactionsTable";
import { APIProvider } from "./core/common/api-provider";

function App() {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  console.log("🚀 ~ App ~ backendUrl:", backendUrl);
  if (!backendUrl) {
    console.warn("Backend URL is not configured properly");
  }

  return (
    <APIProvider>
      <Dashboard />
      <SearchInput />
      <TransactionsTable />
    </APIProvider>
  );
}

export default App;
