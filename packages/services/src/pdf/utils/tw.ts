import { registerFontArimo } from "../fonts/register-arimo";
import { registerLiberationSans } from "../fonts/register-liberation-sans";
import { createTw } from "react-pdf-tailwind";

registerLiberationSans();
registerFontArimo();

const tw: ReturnType<typeof createTw> = createTw({
  fontFamily: {
    sans: ["Liberation Sans", "Arimo"],
  },
});

export { tw };
