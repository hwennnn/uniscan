import Dashboard from "./components/Dashboard";
import { APIProvider } from "./core/common/api-provider";

function App() {
  return (
    <APIProvider>
      <Dashboard />
    </APIProvider>
  );
}

export default App;
