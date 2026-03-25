import { useRef, useState, useEffect, ReactNode } from "react";
import { Check, ChevronDown } from "lucide-react";

interface StepLayoutProps {
  stepNumber: number;
  title: string;
  children: ReactNode;
  acknowledgmentText: string;
  isCompleted: boolean;
  onAcknowledge: () => void;
  onContinue: () => void;
  requireScroll?: boolean;
}

const StepLayout = ({
  stepNumber,
  title,
  children,
  acknowledgmentText,
  isCompleted,
  onAcknowledge,
  onContinue,
  requireScroll = false,
}: StepLayoutProps) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(!requireScroll);
  const [acknowledged, setAcknowledged] = useState(isCompleted);

  useEffect(() => {
    if (!requireScroll) return;
    const el = contentRef.current;
    if (!el) return;

    const checkScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      if (scrollTop + clientHeight >= scrollHeight - 40) {
        setHasScrolledToBottom(true);
      }
    };

    // Check if content is short enough to not need scrolling
    if (el.scrollHeight <= el.clientHeight + 40) {
      setHasScrolledToBottom(true);
    }

    el.addEventListener("scroll", checkScroll);
    return () => el.removeEventListener("scroll", checkScroll);
  }, [requireScroll]);

  const handleAcknowledge = () => {
    setAcknowledged(true);
    onAcknowledge();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 pt-8 pb-4 max-w-4xl mx-auto w-full">
        <span className="step-label">STEP {String(stepNumber).padStart(2, "0")}</span>
        <h2 className="section-header mt-2">{title}</h2>
      </div>

      <div
        ref={contentRef}
        className="flex-1 overflow-y-auto px-6 pb-8"
      >
        <div className="max-w-4xl mx-auto space-y-4">
          {children}
        </div>
      </div>

      <div className="border-t border-border px-6 py-6 bg-tactical-steel/30">
        <div className="max-w-4xl mx-auto">
          {!hasScrolledToBottom && requireScroll && (
            <div className="flex items-center justify-center gap-2 text-slate-grey mb-4 animate-pulse">
              <ChevronDown className="w-4 h-4" />
              <span className="font-mono text-xs uppercase tracking-widest">Scroll to continue</span>
              <ChevronDown className="w-4 h-4" />
            </div>
          )}

          <label
            className={`flex items-start gap-3 cursor-pointer select-none ${
              !hasScrolledToBottom ? "opacity-30 pointer-events-none" : ""
            }`}
          >
            <div
              className={`w-5 h-5 mt-0.5 rounded-sm border-2 flex items-center justify-center transition-all ${
                acknowledged
                  ? "bg-command-gold border-command-gold"
                  : "border-slate-grey hover:border-command-gold"
              }`}
              onClick={!acknowledged ? handleAcknowledge : undefined}
            >
              {acknowledged && <Check className="w-3.5 h-3.5 text-background animate-scale-check" />}
            </div>
            <span className="text-sm text-steel-white/80 leading-relaxed">{acknowledgmentText}</span>
          </label>

          {acknowledged && (
            <button
              onClick={onContinue}
              className="mt-6 w-full py-3.5 font-heading text-sm uppercase tracking-[0.2em] font-bold bg-warning-red text-steel-white hover:bg-warning-red/90 transition-colors rounded-sm"
            >
              Continue →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StepLayout;
