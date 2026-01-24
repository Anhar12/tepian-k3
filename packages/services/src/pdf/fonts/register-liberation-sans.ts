import { Font } from "@react-pdf/renderer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const registerLiberationSans = () => {
  const fontsDir = path.join(__dirname, "../assets/fonts/liberation-sans");

  Font.register({
    family: "Liberation Sans", // or alias as "Arial"
    fonts: [
      {
        src: path.join(fontsDir, "LiberationSans-Regular.ttf"),
        fontWeight: 400,
      },
      {
        src: path.join(fontsDir, "LiberationSans-Italic.ttf"),
        fontStyle: "italic",
        fontWeight: 400,
      },
      {
        src: path.join(fontsDir, "LiberationSans-Bold.ttf"),
        fontWeight: 700,
      },
      {
        src: path.join(fontsDir, "LiberationSans-BoldItalic.ttf"),
        fontStyle: "italic",
        fontWeight: 700,
      },
    ],
  });
};
