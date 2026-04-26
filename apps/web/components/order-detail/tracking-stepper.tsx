import * as React from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { getShippingStatus } from "@/lib/shipping-status";

const STEPS = [
  "Paid",
  "Processing",
  "Shipped",
  "In Transit",
  "Out for Delivery",
  "Delivered",
] as const;

type Step = (typeof STEPS)[number];

/**
 * Map a normalized shipping status label to the index of the highest
 * completed step. Returns -1 when the order is in a non-progress state
 * like "Cancelled" or "Return / Refund".
 */
function statusToCompletedStep(label: string): number {
  switch (label) {
    case "Payment Pending":
      return -1;
    case "Payment Accepted":
      return 0;
    case "Processing":
      return 1;
    case "Shipped":
      return 2;
    case "In Transit":
      return 3;
    case "Out for Delivery":
      return 4;
    case "Delivered":
      return 5;
    default:
      return -1;
  }
}

interface TrackingStepperProps {
  /** Raw status string from the order record. */
  status: string;
  /** "horizontal" on desktop drawer, "vertical" on mobile detail page. */
  orientation?: "horizontal" | "vertical";
  className?: string;
}

export function TrackingStepper({
  status,
  orientation = "horizontal",
  className,
}: TrackingStepperProps) {
  const normalized = getShippingStatus(status).label;
  const completed = statusToCompletedStep(normalized);
  const isCancelled =
    normalized === "Cancelled" || normalized === "Return / Refund";

  if (orientation === "vertical") {
    return (
      <ol className={cn("flex flex-col", className)}>
        {STEPS.map((step, i) => (
          <StepRow
            key={step}
            label={step}
            state={getStepState(i, completed, isCancelled)}
            isLast={i === STEPS.length - 1}
            orientation="vertical"
          />
        ))}
      </ol>
    );
  }

  return (
    <div className={cn("relative pt-3", className)}>
      <div className="absolute left-3 right-3 top-[22px] h-px bg-border" aria-hidden />
      <div
        className="absolute left-3 top-[22px] h-px bg-primary shadow-[0_0_10px_rgba(167,139,250,0.5)] transition-all duration-300"
        style={{
          width:
            completed < 0
              ? 0
              : `calc((100% - 24px) * ${completed} / ${STEPS.length - 1})`,
        }}
        aria-hidden
      />
      <ol className="relative flex justify-between">
        {STEPS.map((step, i) => (
          <li key={step} className="flex flex-col items-center gap-2">
            <StepDot state={getStepState(i, completed, isCancelled)} />
            <span
              className={cn(
                "text-[10px] font-semibold uppercase tracking-wider",
                getStepState(i, completed, isCancelled) === "pending"
                  ? "text-muted-foreground"
                  : "text-primary"
              )}
            >
              {step}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

type StepState = "complete" | "current" | "pending";

function getStepState(
  index: number,
  completed: number,
  isCancelled: boolean
): StepState {
  if (isCancelled) return "pending";
  if (index <= completed) return "complete";
  if (index === completed + 1) return "current";
  return "pending";
}

function StepDot({ state }: { state: StepState }) {
  if (state === "complete") {
    return (
      <span className="z-10 flex size-6 items-center justify-center rounded-full bg-primary ring-4 ring-card">
        <Check className="size-3 text-primary-foreground" strokeWidth={3} />
      </span>
    );
  }
  if (state === "current") {
    return (
      <span className="z-10 flex size-6 items-center justify-center rounded-full bg-primary/20 ring-4 ring-card">
        <span className="size-2 animate-pulse rounded-full bg-primary" />
      </span>
    );
  }
  return (
    <span className="z-10 flex size-6 items-center justify-center rounded-full border border-border bg-background ring-4 ring-card">
      <span className="size-1.5 rounded-full bg-muted-foreground/40" />
    </span>
  );
}

function StepRow({
  label,
  state,
  isLast,
  orientation,
}: {
  label: Step;
  state: StepState;
  isLast: boolean;
  orientation: "vertical" | "horizontal";
}) {
  if (orientation !== "vertical") return null;
  return (
    <li className="relative flex gap-3 pl-1">
      <div className="flex flex-col items-center">
        <StepDot state={state} />
        {!isLast && (
          <span
            aria-hidden
            className={cn(
              "mt-1 mb-1 w-px flex-1",
              state === "complete" ? "bg-primary/60" : "bg-border"
            )}
            style={{ minHeight: 28 }}
          />
        )}
      </div>
      <div className={cn("pb-4 pt-0.5", isLast && "pb-0")}>
        <p
          className={cn(
            "text-sm font-semibold",
            state === "pending" ? "text-muted-foreground" : "text-foreground"
          )}
        >
          {label}
        </p>
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
          {state === "current"
            ? "In progress"
            : state === "complete"
              ? "Completed"
              : "Pending"}
        </p>
      </div>
    </li>
  );
}
