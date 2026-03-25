interface DirectiveCardProps {
  number?: number;
  title: string;
  description: string;
  variant?: "default" | "danger";
  delay?: number;
}

const DirectiveCard = ({ number, title, description, variant = "default", delay = 0 }: DirectiveCardProps) => {
  return (
    <div
      className={`animate-fade-in-up ${variant === "danger" ? "directive-card-danger" : "directive-card"}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start gap-4">
        {number !== undefined && (
          <span className="font-mono text-command-gold text-sm font-bold mt-0.5 shrink-0">
            {String(number).padStart(2, "0")}
          </span>
        )}
        <div>
          <h3 className="font-heading text-lg font-bold uppercase tracking-wider text-steel-white mb-2">{title}</h3>
          <p className="text-sm text-steel-white/70 leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
};

export default DirectiveCard;
