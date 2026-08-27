import { ThemeProvider } from "./context/ThemeContext";

const App = () => (
  <ThemeProvider>
    <AppContent />
  </ThemeProvider>
);

const AppContent = () => {
  return <div className=""></div>;
};

export default App;
