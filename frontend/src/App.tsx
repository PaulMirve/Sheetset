import { useSyncExternalStore } from "react";
import { getToken, subscribeToken } from "./api";
import { ThemeProvider } from "./context/ThemeContext";
import Auth from "./layout/Auth";
import Main from "./layout/Main";
import Sidebar from "./layout/Sidebar";

const App = () => {
  const token = useSyncExternalStore(subscribeToken, getToken);
  return (
    <ThemeProvider>
      {token ? (
        <div className="h-full grid grid-cols-[288px_minmax(0,1fr)] max-md:grid-cols-1 max-md:grid-rows-[auto_minmax(0,1fr)]">
          <Sidebar />
          <Main />
        </div>
      ) : (
        <Auth />
      )}
    </ThemeProvider>
  );
};

export default App;
