import { ThemeProvider } from "./context/ThemeContext";
import Main from "./layout/Main";
import Sidebar from "./layout/Sidebar";

const App = () => (
  <ThemeProvider>
    <div className="h-full grid grid-cols-[288px_minmax(0,1fr)] max-md:grid-cols-1 max-md:grid-rows-[auto_minmax(0,1fr)]">
      <Sidebar />
      <Main />
    </div>
  </ThemeProvider>
);

export default App;
