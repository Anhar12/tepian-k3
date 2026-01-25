import { registerFontArimo } from "../fonts/register-arimo";
import { registerLiberationSans } from "../fonts/register-liberation-sans";
import { createTw } from "react-pdf-tailwind";

registerLiberationSans();
registerFontArimo();

const baseTw = createTw({
  fontFamily: {
    sans: ["Liberation Sans", "Arimo"],
  },
});

const buildClassString = (
  ...classes: (string | false | undefined | null)[]
) => {
  return classes
    .flatMap((cls) =>
      // Split each class by whitespace to handle template literals with multiple classes
      typeof cls === "string" ? cls.split(/\s+/) : cls == null ? [] : [],
    )
    .filter((cls) => cls && typeof cls === "string" && cls.trim() !== "")
    .join(" ")
    .trim();
};

const tw: ReturnType<typeof createTw> = (
  ...classes: (string | false | undefined | null)[]
) => {
  return baseTw(buildClassString(...classes));
};

export { tw };
