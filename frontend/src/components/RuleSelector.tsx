import { useState, useEffect } from "react";
import CreateRuleModal from "./CreateRuleModal";
import { createRule, fetchRules, type RuleDto } from "../api/rules";

interface RuleSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyRules?: (selectedRules: RuleDto[]) => void;
  exercises: { id: string; name: string; notes: string }[];
  userId: string | null;
}

export default function RuleSelector({ isOpen, onClose, onApplyRules, exercises, userId }: RuleSelectorProps) {
  const [isCreateRuleOpen, setIsCreateRuleOpen] = useState(false);
  const [selectedRuleIds, setSelectedRuleIds] = useState<string[]>([]);
  const [rules, setRules] = useState<RuleDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch rules when modal opens
  useEffect(() => {
    if (isOpen && userId) {
      fetchRulesForUser();
    }
  }, [isOpen, userId]);

  const fetchRulesForUser = async () => {
    if (!userId) {
      setRules([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchRules(userId);
      setRules(data);
    } catch (err) {
      console.error("Error fetching rules:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch rules");
      setRules([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveRule = async (ruleData: {
    name: string;
    ifExercise: string;
    ifActivityType: string;
    ifTiming: string;
    thenExercise: string;
    thenActivityType: string;
    thenRestriction: string;
  }) => {
    if (!userId) {
      alert("You must be logged in to create rules.");
      return;
    }

    try {
      await createRule({
        userId,
        ...ruleData,
      });

      setIsCreateRuleOpen(false);
      // Refresh the rules list after successfully saving
      await fetchRulesForUser();
    } catch (err) {
      console.error("Error saving rule:", err);
      // Optionally show error message to user
      alert("Failed to save rule. Please try again.");
    }
  };

  const toggleRuleSelection = (ruleId: string) => {
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
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-white/70">Loading rules...</p>
                  </div>
                ) : error ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-red-400/80">{error}</p>
                  </div>
                ) : rules.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-white/50">No rules available. Create one to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {rules.map((rule) => (
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
                )}
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
        exercisesFromSidebar={exercises}
      />
    </>
  );
}
