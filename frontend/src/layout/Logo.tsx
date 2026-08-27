import LOGO_LIGHT from "../assets/logo-light.svg";
import LOGO_DARK from "../assets/logo-dark.svg";
import { useTheme } from "../context/ThemeContext";

const Logo = () => {
  const { theme } = useTheme();
  return theme === "light" ? (
    <img src={LOGO_LIGHT} alt="Logo Light" />
  ) : (
    <img src={LOGO_DARK} alt="Logo Dark" />
  );
};

export default Logo;
