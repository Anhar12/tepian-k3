import { registerFontArimo } from "../fonts/register-arimo";
import { registerLiberationSans } from "../fonts/register-liberation-sans";
import { createTw } from "react-pdf-tailwind";

registerLiberationSans();
registerFontArimo();

const tw = createTw({
  fontFamily: {
    sans: ["Liberation Sans", "Arimo"],
  },
}) as ReturnType<typeof createTw>;

export { tw };
