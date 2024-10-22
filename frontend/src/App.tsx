import { APIProvider } from "./core/common/api-provider";
import MainScreen from "./MainScreen";

function App() {
  return (
    <APIProvider>
      <MainScreen />
    </APIProvider>
  );
}

export default App;
