import GridBackground from "@/components/grid-background";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

const TITLE_TEXT = `
 ██████╗ ███████╗████████╗████████╗███████╗██████╗
 ██╔══██╗██╔════╝╚══██╔══╝╚══██╔══╝██╔════╝██╔══██╗
 ██████╔╝█████╗     ██║      ██║   █████╗  ██████╔╝
 ██╔══██╗██╔══╝     ██║      ██║   ██╔══╝  ██╔══██╗
 ██████╔╝███████╗   ██║      ██║   ███████╗██║  ██║
 ╚═════╝ ╚══════╝   ╚═╝      ╚═╝   ╚══════╝╚═╝  ╚═╝

 ████████╗    ███████╗████████╗ █████╗  ██████╗██╗  ██╗
 ╚══██╔══╝    ██╔════╝╚══██╔══╝██╔══██╗██╔════╝██║ ██╔╝
    ██║       ███████╗   ██║   ███████║██║     █████╔╝
    ██║       ╚════██║   ██║   ██╔══██║██║     ██╔═██╗
    ██║       ███████║   ██║   ██║  ██║╚██████╗██║  ██╗
    ╚═╝       ╚══════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝
 `;

function HomeComponent() {
  return (
    <div className="relative min-h-screen w-full bg-white dark:bg-neutral-950">
      {/* Grid background layer with fade effect */}
      <GridBackground />
      {/* Content layer - not affected by mask */}
      <div className="relative container mx-auto max-w-3xl px-4 py-2">
        <pre className="overflow-x-auto font-mono text-sm">{TITLE_TEXT}</pre>
        <div className="grid gap-6">
          {/* Card with inverted corner effect */}
          <section className="relative rounded-2xl border border-r-0 border-t-0 bg-white p-6 dark:bg-neutral-900">
            {/* Inverted corner at top-right with proper border */}
            <svg
              className="absolute -top-px -right-px h-8 w-8"
              viewBox="0 0 32 32"
              fill="none"
            >
              {/* Background fill for the inverted curve */}
              <path
                d="M 0 0 L 32 0 L 32 32 Q 32 0 0 0 Z"
                className="fill-white dark:fill-neutral-950"
              />
              {/* The inverted curve border */}
              <path
                d="M 0 0 Q 32 0 32 32"
                className="stroke-border"
                strokeWidth="1"
                fill="none"
              />
            </svg>
            {/* Top border line (left of the notch) */}
            <div className="bg-border absolute -top-px left-3 h-px w-[calc(100%-2rem)]" />
            {/* Right border line (below the notch) */}
            <div className="bg-border absolute -right-px top-8 h-[calc(100%-2.5rem)] w-px" />
            <h2 className="text-lg font-semibold">Card Title</h2>
            <p className="text-muted-foreground mt-2">
              This card has an inverted border radius effect on the top-right
              corner.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
