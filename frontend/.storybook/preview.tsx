import type { Preview } from "@storybook/react-vite";
import "../src/colors.scss";
import "../src/index.css";

const preview: Preview = {
  decorators: [
    (Story, context) => {
      document.documentElement.dataset.theme = context.globals.theme ?? "light";
      return <Story />;
    },
  ],
  globalTypes: {
    theme: {
      description: "Color theme",
      toolbar: {
        title: "Theme",
        icon: "circlehollow",
        items: ["light", "dark"],
        dynamicTitle: true,
      },
    },
  },
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: "todo",
    },
  },
};

export default preview;
