import { clsx, type ClassValue } from "clsx";
import { registerFontArimo } from "../fonts/register-arimo";
import { registerLiberationSans } from "../fonts/register-liberation-sans";
import { createTw } from "react-pdf-tailwind";

registerLiberationSans();
registerFontArimo();

const baseTw: ReturnType<typeof createTw> = createTw({
  fontFamily: {
    sans: ["Liberation Sans", "Arimo"],
  },
});

/** Style object compatible with react-pdf components */
type Style = ReturnType<typeof baseTw>;

/**
 * Tailwind-like utility for react-pdf styling.
 * Works like `cn()` - accepts multiple class strings, conditionals, and falsy values.
 *
 * @example
 * // Single class string
 * tw("flex-row items-center")
 *
 * // Multiple arguments
 * tw("flex-row", "items-center", "p-4")
 *
 * // Conditional classes
 * tw("flex-row", isActive && "bg-blue-500", !isActive && "bg-gray-200")
 *
 * // Template literals with conditions
 * tw(`flex-row ${spacing}`, className)
 *
 * // Object syntax (from clsx)
 * tw({ "font-bold": isBold, "text-center": centered })
 *
 * // Array syntax (from clsx)
 * tw(["flex-row", condition && "items-center"])
 */
const tw = (...classes: ClassValue[]): Style => {
  const result = clsx(classes)
    .split(/\s+/)
    .filter(Boolean)
    .join(" ");

  // Return empty style object if no valid classes
  if (!result) return {} as Style;

  return baseTw(result);
};

export { tw, type ClassValue, type Style };
