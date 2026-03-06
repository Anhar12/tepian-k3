/**
 * Reusable page margin presets for react-pdf documents.
 *
 * All values are in points (pt), where 1 cm = 28.346 pt.
 * Use these constants as the `style` prop on a `<Page>` component,
 * optionally combined with other styles via an array.
 *
 * @example
 * <Page size="A4" style={[PAGE_MARGINS.standard, tw("text-[11px] font-sans")]}>
 */

/** 1 centimeter expressed in PDF points */
const CM_TO_PT = 28.346;

/** Converts centimeters to PDF points */
const cm = (value: number) => value * CM_TO_PT;

/**
 * Standard assignment-letter page margins:
 * - Top:    0.25 cm
 * - Bottom: 1.43 cm
 * - Left:   2.54 cm (1 inch)
 * - Right:  1.75 cm
 */
export const PAGE_MARGINS = {
  assignmentLetter: {
    paddingTop: cm(0.25),
    paddingBottom: cm(1.43),
    paddingLeft: cm(2.54),
    paddingRight: cm(1.75),
  },
} as const satisfies Record<string, Record<string, number>>;
