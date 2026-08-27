import { ThemeProvider, useTheme } from "./context/ThemeContext";

const App = () => (
  <ThemeProvider>
    <AppContent />
  </ThemeProvider>
);

const AppContent = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="">
      <p>Theme: {theme}</p>
      <button onClick={toggleTheme}>Toggle theme</button>
    </div>
  );
};

export default App;
