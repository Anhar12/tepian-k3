import { Font } from "@react-pdf/renderer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const registerFontArimo = () => {
  // Go up from fonts/ to src/, then into assets/fonts/arimo/
  const fontsDir = path.join(__dirname, "../assets/fonts/arimo");

  Font.register({
    family: "Arimo",
    fonts: [
      {
        src: path.join(fontsDir, "Arimo-Regular.ttf"),
        fontWeight: 400,
      },
      {
        src: path.join(fontsDir, "Arimo-Italic.ttf"),
        fontStyle: "italic",
        fontWeight: 400,
      },
      {
        src: path.join(fontsDir, "Arimo-Medium.ttf"),
        fontWeight: 500,
      },
      {
        src: path.join(fontsDir, "Arimo-MediumItalic.ttf"),
        fontStyle: "italic",
        fontWeight: 500,
      },
      {
        src: path.join(fontsDir, "Arimo-SemiBold.ttf"),
        fontWeight: 600,
      },
      {
        src: path.join(fontsDir, "Arimo-SemiBoldItalic.ttf"),
        fontStyle: "italic",
        fontWeight: 600,
      },
      {
        src: path.join(fontsDir, "Arimo-Bold.ttf"),
        fontWeight: 700,
      },
      {
        src: path.join(fontsDir, "Arimo-BoldItalic.ttf"),
        fontStyle: "italic",
        fontWeight: 700,
      },
    ],
  });
};
