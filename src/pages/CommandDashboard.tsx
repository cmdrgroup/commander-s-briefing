import { useState } from "react";
import { Plus, Copy, Eye, Check, Users, Clock, CheckCircle2, AlertCircle } from "lucide-react";

interface Operator {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  enrolledAt: string;
  status: "not_started" | "in_progress" | "complete";
  currentStep: number;
  completedSteps: number;
  lastActiveAt: string | null;
  slug: string;
}

const DEMO_OPERATORS: Operator[] = [
  {
    id: "1", firstName: "Jake", lastName: "Morrison", email: "jake@morrison.com",
    enrolledAt: "2026-03-20", status: "complete", currentStep: 8, completedSteps: 9,
    lastActiveAt: "2026-03-22T14:30:00", slug: "jake-m-abc123",
  },
  {
    id: "2", firstName: "Marcus", lastName: "Chen", email: "marcus@chenconstruction.com",
    enrolledAt: "2026-03-22", status: "in_progress", currentStep: 4, completedSteps: 4,
    lastActiveAt: "2026-03-25T09:15:00", slug: "marcus-c-def456",
  },
  {
    id: "3", firstName: "Ryan", lastName: "Thompson", email: "ryan@tpengineering.com.au",
    enrolledAt: "2026-03-24", status: "not_started", currentStep: 0, completedSteps: 0,
    lastActiveAt: null, slug: "ryan-t-ghi789",
  },
];

const STEP_NAMES = [
  "Welcome", "Mission Directive", "Rules of Engagement", "Mission Parameters",
  "Failure Points", "Center of Gravity", "Communications", "Battle Rhythm", "Signature",
];

const CommandDashboard = () => {
  const [operators] = useState<Operator[]>(DEMO_OPERATORS);
  const [showAddForm, setShowAddForm] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);

  const stats = {
    total: operators.length,
    completed: operators.filter((o) => o.status === "complete").length,
    inProgress: operators.filter((o) => o.status === "in_progress").length,
    notStarted: operators.filter((o) => o.status === "not_started").length,
  };

  const copyLink = (slug: string, id: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/onboard/${slug}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const statusBadge = (status: Operator["status"]) => {
    const styles = {
      complete: "bg-field-green/20 text-field-green border-field-green/30",
      in_progress: "bg-command-gold/20 text-command-gold border-command-gold/30",
      not_started: "bg-gunmetal text-slate-grey border-gunmetal",
    };
    const labels = { complete: "COMPLETE", in_progress: "IN PROGRESS", not_started: "NOT STARTED" };
    return (
      <span className={`font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-sm border ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="classified-strip">
        ⬛ COMMAND DASHBOARD — CMDR GROUP — OPERATOR STATUS
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="section-header">Command Dashboard</h1>
            <p className="text-sm text-slate-grey mt-1">Operator deployment status overview</p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2.5 bg-warning-red text-steel-white font-heading text-xs uppercase tracking-widest hover:bg-warning-red/90 transition-colors rounded-sm"
          >
            <Plus className="w-4 h-4" /> Add Operator
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Operators", value: stats.total, icon: Users, color: "text-steel-white" },
            { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-field-green" },
            { label: "In Progress", value: stats.inProgress, icon: Clock, color: "text-command-gold" },
            { label: "Not Started", value: stats.notStarted, icon: AlertCircle, color: "text-slate-grey" },
          ].map((stat) => (
            <div key={stat.label} className="directive-card">
              <div className="flex items-center gap-3">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                <div>
                  <p className="font-heading text-2xl font-bold text-steel-white">{stat.value}</p>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-slate-grey">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="directive-card mb-6 animate-fade-in-up">
            <h3 className="font-heading text-sm uppercase tracking-wider text-command-gold mb-4">Add New Operator</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input placeholder="First Name" className="bg-background border border-gunmetal rounded-sm px-3 py-2 text-sm text-steel-white focus:outline-none focus:border-command-gold" />
              <input placeholder="Last Name" className="bg-background border border-gunmetal rounded-sm px-3 py-2 text-sm text-steel-white focus:outline-none focus:border-command-gold" />
              <input placeholder="Email" className="bg-background border border-gunmetal rounded-sm px-3 py-2 text-sm text-steel-white focus:outline-none focus:border-command-gold" />
            </div>
            <button className="mt-4 px-6 py-2 bg-command-gold text-background font-heading text-xs uppercase tracking-widest hover:bg-command-gold/90 transition-colors rounded-sm">
              Generate Link
            </button>
          </div>
        )}

        {/* Operator Table */}
        <div className="directive-card overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gunmetal">
                {["Name", "Email", "Enrolled", "Status", "Progress", "Last Active", "Actions"].map((h) => (
                  <th key={h} className="text-left py-3 px-3 font-mono text-[10px] uppercase tracking-widest text-slate-grey">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {operators.map((op) => (
                <tr key={op.id} className="border-b border-gunmetal/50 hover:bg-tactical-steel/30 transition-colors">
                  <td className="py-3 px-3 font-heading text-sm tracking-wider text-steel-white">
                    {op.firstName} {op.lastName}
                  </td>
                  <td className="py-3 px-3 text-xs text-slate-grey">{op.email}</td>
                  <td className="py-3 px-3 font-mono text-xs text-slate-grey">{op.enrolledAt}</td>
                  <td className="py-3 px-3">{statusBadge(op.status)}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-gunmetal rounded-full overflow-hidden">
                        <div
                          className="h-full bg-command-gold rounded-full transition-all"
                          style={{ width: `${(op.completedSteps / 9) * 100}%` }}
                        />
                      </div>
                      <span className="font-mono text-[10px] text-slate-grey">
                        {op.completedSteps}/9
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono text-xs text-slate-grey">
                    {op.lastActiveAt
                      ? new Date(op.lastActiveAt).toLocaleDateString("en-AU", { day: "2-digit", month: "short" })
                      : "—"}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedOperator(op)}
                        className="p-1.5 hover:bg-gunmetal rounded-sm transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-grey" />
                      </button>
                      <button
                        onClick={() => copyLink(op.slug, op.id)}
                        className="p-1.5 hover:bg-gunmetal rounded-sm transition-colors"
                        title="Copy Link"
                      >
                        {copiedId === op.id ? (
                          <Check className="w-3.5 h-3.5 text-field-green" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-slate-grey" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Detail Modal */}
        {selectedOperator && (
          <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-40 p-6" onClick={() => setSelectedOperator(null)}>
            <div className="directive-card max-w-md w-full animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading text-lg uppercase tracking-wider text-command-gold">
                  {selectedOperator.firstName} {selectedOperator.lastName}
                </h3>
                <button onClick={() => setSelectedOperator(null)} className="text-slate-grey hover:text-steel-white text-sm">✕</button>
              </div>
              <div className="space-y-2">
                {STEP_NAMES.map((name, i) => (
                  <div key={i} className="flex items-center gap-3 py-1.5">
                    <div className={`w-5 h-5 rounded-sm flex items-center justify-center ${
                      i < selectedOperator.completedSteps ? "bg-field-green" : "bg-gunmetal"
                    }`}>
                      {i < selectedOperator.completedSteps && <Check className="w-3 h-3 text-steel-white" />}
                    </div>
                    <span className="font-mono text-xs text-slate-grey w-8">{String(i).padStart(2, "0")}</span>
                    <span className={`text-sm ${i < selectedOperator.completedSteps ? "text-steel-white/70" : "text-slate-grey"}`}>
                      {name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="noise-overlay" />
    </div>
  );
};

export default CommandDashboard;
