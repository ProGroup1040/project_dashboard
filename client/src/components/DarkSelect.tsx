/**
 * DarkSelect — Unified dark-theme <select> wrapper.
 * Use this everywhere instead of raw <select> to guarantee consistent
 * dark background + white text across all states (default, hover, focus,
 * selected, disabled) and across browsers/OS.
 */
import React from "react";
import { cn } from "@/lib/utils";

export interface DarkSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  /** Extra wrapper className */
  wrapperClassName?: string;
}

export const DarkSelect = React.forwardRef<
  HTMLSelectElement,
  DarkSelectProps
>(({ className, wrapperClassName, children, ...props }, ref) => {
  return (
    <div className={cn("relative w-full", wrapperClassName)}>
      <select
        ref={ref}
        {...props}
        className={cn(
          // Layout
          "w-full appearance-none cursor-pointer",
          // Sizing & spacing
          "px-3 py-2 pr-8 text-sm",
          // Dark background + white text — always
          "bg-[#1a1a2e] text-white",
          // Border
          "border border-white/20 rounded-lg",
          // Focus ring
          "focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50",
          // Disabled
          "disabled:opacity-50 disabled:cursor-not-allowed",
          // Transition
          "transition-colors duration-150",
          className
        )}
        style={{
          // Force dark background on every browser including Safari/Firefox
          // which sometimes override <select> background with OS native style
          colorScheme: "dark",
          ...props.style,
        }}
      >
        {children}
      </select>
      {/* Custom chevron icon */}
      <span
        className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-white/50"
        aria-hidden="true"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </span>
    </div>
  );
});

DarkSelect.displayName = "DarkSelect";

/**
 * DarkOption — use inside DarkSelect to guarantee dark bg + white text
 * on each <option> element (needed for Firefox / Windows).
 */
export const DarkOption: React.FC<
  React.OptionHTMLAttributes<HTMLOptionElement>
> = ({ children, ...props }) => (
  <option
    {...props}
    style={{
      backgroundColor: "#1a1a2e",
      color: props.disabled ? "#6b7280" : "#ffffff",
      ...props.style,
    }}
  >
    {children}
  </option>
);
