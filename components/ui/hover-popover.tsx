import * as React from "react";

import { cn } from "@/lib/utils";

type HoverPopoverProps = {
  content: string;
  children: React.ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
  panelClassName?: string;
};

const alignClasses = {
  left: "left-0",
  center: "left-1/2 -translate-x-1/2",
  right: "right-0",
} satisfies Record<NonNullable<HoverPopoverProps["align"]>, string>;

export function HoverPopover({
  content,
  children,
  align = "center",
  className,
  panelClassName,
}: HoverPopoverProps) {
  return (
    <span className={cn("group relative inline-flex", className)}>
      <button
        type="button"
        aria-label={content}
        className="inline-flex items-center rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {children}
      </button>
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute top-full z-20 mt-2 w-56 rounded-md border border-border/70 bg-popover/95 p-3 text-xs leading-relaxed text-popover-foreground opacity-0 shadow-lg backdrop-blur transition group-hover:opacity-100 group-focus-within:opacity-100",
          alignClasses[align],
          panelClassName,
        )}
      >
        {content}
      </span>
    </span>
  );
}
