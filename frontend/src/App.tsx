import { ThemeProvider } from "./context/ThemeContext";
import Main from "./layout/Main";
import Navbar from "./layout/Navbar";
import Sidebar from "./layout/Sidebar";
import styles from "./App.module.scss";
import classNames from "classnames";

const App = () => (
  <ThemeProvider>
    <AppContent />
  </ThemeProvider>
);

const AppContent = () => {
  return (
    <div
      className={classNames("h-screen border-t border-t-lines", styles.main)}
    >
      <Sidebar />
      <Navbar />
      <Main />
    </div>
  );
};

export default App;
