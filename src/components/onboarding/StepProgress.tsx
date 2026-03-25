import { STEP_NAMES } from "@/data/onboardingContent";
import { Check } from "lucide-react";

interface StepProgressProps {
  currentStep: number;
  completedSteps: boolean[];
}

const StepProgress = ({ currentStep, completedSteps }: StepProgressProps) => {
  const totalSteps = STEP_NAMES.length;
  const completedCount = completedSteps.filter(Boolean).length;
  const progressPercent = (completedCount / totalSteps) * 100;

  return (
    <div className="w-full px-4 py-3 border-b border-border bg-tactical-steel/50">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-xs tracking-widest uppercase text-slate-grey">
            STEP {String(currentStep).padStart(2, "0")} OF {String(totalSteps - 1).padStart(2, "0")}
          </span>
          <span className="font-mono text-xs tracking-widest text-command-gold">
            {Math.round(progressPercent)}% COMPLETE
          </span>
        </div>
        <div className="flex gap-1">
          {STEP_NAMES.map((_, i) => (
            <div key={i} className="flex-1 relative">
              <div className="h-1.5 rounded-full bg-gunmetal overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: completedSteps[i] ? "100%" : i === currentStep ? "50%" : "0%",
                    backgroundColor: completedSteps[i]
                      ? "hsl(var(--command-gold))"
                      : i === currentStep
                      ? "hsl(var(--command-gold) / 0.4)"
                      : "transparent",
                  }}
                />
              </div>
              {completedSteps[i] && (
                <div className="absolute -top-1 right-0 animate-scale-check">
                  <Check className="w-3 h-3 text-command-gold" />
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="hidden md:flex gap-1 mt-1">
          {STEP_NAMES.map((name, i) => (
            <div key={i} className="flex-1">
              <span
                className={`text-[9px] font-mono uppercase tracking-wider truncate block ${
                  i === currentStep
                    ? "text-command-gold"
                    : completedSteps[i]
                    ? "text-slate-grey"
                    : "text-gunmetal"
                }`}
              >
                {name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StepProgress;
