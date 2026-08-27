import { ThemeProvider } from "./context/ThemeContext";
import Sidebar from "./layout/Sidebar";

const App = () => (
  <ThemeProvider>
    <AppContent />
  </ThemeProvider>
);

const AppContent = () => {
  return (
    <div className="h-screen border-t border-t-lines">
      <Sidebar />
    </div>
  );
};

export default App;
