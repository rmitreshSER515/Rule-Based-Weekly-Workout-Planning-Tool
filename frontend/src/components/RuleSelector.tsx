import { useState } from "react";
import CreateRuleModal from "./CreateRuleModal";

interface RuleSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyRules?: (selectedRules: Rule[]) => void;
}

interface Rule {
  id: number;
  name: string;
  ifExercise: string;
  ifActivityType: string;
  ifTiming: string;
  thenExercise: string;
  thenActivityType: string;
  thenRestriction: string;
}

export default function RuleSelector({ isOpen, onClose, onApplyRules }: RuleSelectorProps) {
  const [isCreateRuleOpen, setIsCreateRuleOpen] = useState(false);
  const [selectedRuleIds, setSelectedRuleIds] = useState<number[]>([]);
  const [rules, setRules] = useState<Rule[]>([
    {
      id: 1,
      name: "Marathon_Rule",
      ifExercise: "Hard",
      ifActivityType: "Running",
      ifTiming: "the day before",
      thenExercise: "Easy",
      thenActivityType: "Biking",
      thenRestriction: "not allowed",
    },
    {
      id: 2,
      name: "Triathlon_Rule",
      ifExercise: "Medium",
      ifActivityType: "Swimming",
      ifTiming: "the day after",
      thenExercise: "Hard",
      thenActivityType: "Running",
      thenRestriction: "allowed",
    },
  ]);

  const handleSaveRule = (ruleData: any) => {
    const newRule: Rule = {
      id: rules.length + 1,
      ...ruleData,
    };
    setRules([...rules, newRule]);
    setIsCreateRuleOpen(false);
  };

  const toggleRuleSelection = (ruleId: number) => {
    setSelectedRuleIds((prev) =>
      prev.includes(ruleId)
        ? prev.filter((id) => id !== ruleId)
        : [...prev, ruleId]
    );
  };

  const handleApplyRules = () => {
    if (selectedRuleIds.length === 0) return;
    const selected = rules.filter((rule) => selectedRuleIds.includes(rule.id));
    onApplyRules?.(selected);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative z-10 w-full max-w-2xl mx-4">
          <div className="rounded-2xl border border-white/15 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 backdrop-blur-xl shadow-2xl overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950" />
            <div className="absolute -top-32 -left-32 h-[520px] w-[520px] rounded-full bg-fuchsia-500/20 blur-[90px]" />
            <div className="absolute -bottom-40 -right-40 h-[620px] w-[620px] rounded-full bg-cyan-400/15 blur-[110px]" />
            <div
              className="absolute inset-0 opacity-[0.10]"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.35) 1px, transparent 0)",
                backgroundSize: "26px 26px",
              }}
            />

            {/* Content */}
            <div className="relative z-10 p-8 flex flex-col h-[500px]">
              {/* Header */}
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-white">Rule Selector</h2>
              </div>

              {/* Rules List */}
              <div className="flex-1 overflow-y-auto mb-6 pr-4">
                <div className="space-y-2">
                  {rules.map((rule, index) => (
                    <div
                      key={rule.id}
                      className="flex items-center gap-4 p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/8 transition-colors cursor-pointer"
                      onClick={() => toggleRuleSelection(rule.id)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedRuleIds.includes(rule.id)}
                        onChange={() => toggleRuleSelection(rule.id)}
                        className="flex-shrink-0 w-5 h-5 rounded border-white/30 bg-white/10 accent-teal-500 cursor-pointer"
                        aria-label={`Select ${rule.name}`}
                      />
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <span className="text-white/70 font-medium flex-shrink-0">
                          {rules.findIndex((r) => r.id === rule.id) + 1}.
                        </span>
                        <div className="min-w-0">
                          <p className="text-white font-medium truncate">
                            {rule.name}
                          </p>
                          <p className="text-white/50 text-sm truncate">
                            If {rule.ifExercise} {rule.ifActivityType}
                            {" "}{rule.ifTiming}, then {rule.thenExercise}{" "}
                            {rule.thenActivityType} is {rule.thenRestriction}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Create New Rule Button */}
              <div className="pt-6 border-t border-white/10 space-y-3">
                <button
                  onClick={handleApplyRules}
                  disabled={selectedRuleIds.length === 0}
                  className={`w-full rounded-lg font-semibold py-3 px-4 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 ${
                    selectedRuleIds.length === 0
                      ? "bg-slate-600/60 text-white/40 cursor-not-allowed"
                      : "bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:shadow-lg hover:shadow-emerald-500/40 text-white hover:scale-[1.02] active:scale-[0.98] focus:ring-emerald-400"
                  }`}
                >
                  Apply Selected Rules
                </button>
                <button
                  onClick={() => setIsCreateRuleOpen(true)}
                  className="w-full rounded-lg bg-white/10 hover:bg-white/15 text-white font-semibold py-3 px-4 transition-colors focus:outline-none focus:ring-2 focus:ring-white/30"
                >
                  Create New Rule
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Rule Modal */}
      <CreateRuleModal
        isOpen={isCreateRuleOpen}
        onClose={() => setIsCreateRuleOpen(false)}
        onSave={handleSaveRule}
      />
    </>
  );
}
