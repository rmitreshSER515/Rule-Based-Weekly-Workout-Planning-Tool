import { useState, useEffect, useMemo } from "react";

interface CreateRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rule: RuleData) => void;
  exercisesFromSidebar: { id: string; name: string; notes: string }[];
}

interface RuleData {
  name: string;
  ifExercise: string;
  ifActivityType: string;
  ifTiming: string;
  thenExercise: string;
  thenActivityType: string;
  thenRestriction: string;
}

const exercises = ["Hard", "Easy", "Medium"];
const timings = ["the day before", "the day after", "the same day"];
const restrictions = ["not allowed", "allowed"];

export default function CreateRuleModal({ isOpen, onClose, onSave, exercisesFromSidebar }: CreateRuleModalProps) {
  const firstSidebarExerciseName = useMemo(
    () => (exercisesFromSidebar[0]?.name ?? ""),
    [exercisesFromSidebar]
  );

  const [ruleName, setRuleName] = useState("");
  const [ifExercise, setIfExercise] = useState(exercises[0]);
  const [ifActivityType, setIfActivityType] = useState(firstSidebarExerciseName);
  const [ifTiming, setIfTiming] = useState(timings[0]);
  const [thenExercise, setThenExercise] = useState(exercises[0]);
  const [thenActivityType, setThenActivityType] = useState(firstSidebarExerciseName);
  const [thenRestriction, setThenRestriction] = useState(restrictions[0]);

  // When the list of sidebar exercises changes (or modal opens),
  // keep the selected activity types in sync if they were empty.
  useEffect(() => {
    if (!isOpen) return;
    if (!ifActivityType && firstSidebarExerciseName) {
      setIfActivityType(firstSidebarExerciseName);
    }
    if (!thenActivityType && firstSidebarExerciseName) {
      setThenActivityType(firstSidebarExerciseName);
    }
  }, [isOpen, firstSidebarExerciseName]);

  const handleSave = () => {
    onSave({
      name: ruleName,
      ifExercise,
      ifActivityType,
      ifTiming,
      thenExercise,
      thenActivityType,
      thenRestriction,
    });
    resetForm();
  };

  const resetForm = () => {
    setRuleName("");
    setIfExercise(exercises[0]);
    setIfActivityType(firstSidebarExerciseName);
    setIfTiming(timings[0]);
    setThenExercise(exercises[0]);
    setThenActivityType(firstSidebarExerciseName);
    setThenRestriction(restrictions[0]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
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
          <div className="relative z-10 p-8">
            {/* Header */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white">Create Rule</h2>
            </div>

            {/* Form */}
            <div className="space-y-8">
              {/* Rule Name Input */}
              <div>
                <label className="block text-white font-medium mb-3">
                  Rule Name:
                </label>
                <input
                  type="text"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  placeholder="Enter rule name"
                  className="w-full rounded-lg bg-white/10 border border-white/15 text-white placeholder-white/40 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-all"
                />
              </div>

              {/* Rule Definition */}
              <div>
                <label className="block text-white font-medium mb-4">
                  Rule:
                </label>
                <div className="space-y-4">
                  {/* If clause */}
                  <div className="flex flex-wrap items-center gap-3 p-4 rounded-lg bg-white/5 border border-white/10">
                    <span className="text-white font-medium">If</span>
                    <select
                      value={ifExercise}
                      onChange={(e) => setIfExercise(e.target.value)}
                      className="rounded-lg bg-teal-600/80 hover:bg-teal-600 text-white font-medium px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/30 cursor-pointer transition-colors"
                    >
                      {exercises.map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </select>
                    <select
                      value={ifActivityType}
                      onChange={(e) => setIfActivityType(e.target.value)}
                      className="rounded-lg bg-teal-600/80 hover:bg-teal-600 text-white font-medium px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/30 cursor-pointer transition-colors"
                    >
                      {exercisesFromSidebar.length === 0 && (
                        <option value="">No exercises available</option>
                      )}
                      {exercisesFromSidebar.map((ex) => (
                        <option key={ex.id} value={ex.name}>
                          {ex.name}
                        </option>
                      ))}
                    </select>
                    <span className="text-white">occurs</span>
                    <select
                      value={ifTiming}
                      onChange={(e) => setIfTiming(e.target.value)}
                      className="rounded-lg bg-teal-600/80 hover:bg-teal-600 text-white font-medium px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/30 cursor-pointer transition-colors"
                    >
                      {timings.map((timing) => (
                        <option key={timing} value={timing}>
                          {timing}
                        </option>
                      ))}
                    </select>
                    <span className="text-white">,</span>
                  </div>

                  {/* Then clause */}
                  <div className="flex flex-wrap items-center gap-3 p-4 rounded-lg bg-white/5 border border-white/10">
                    <span className="text-white font-medium">then</span>
                    <select
                      value={thenExercise}
                      onChange={(e) => setThenExercise(e.target.value)}
                      className="rounded-lg bg-teal-600/80 hover:bg-teal-600 text-white font-medium px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/30 cursor-pointer transition-colors"
                    >
                      {exercises.map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </select>
                    <select
                      value={thenActivityType}
                      onChange={(e) => setThenActivityType(e.target.value)}
                      className="rounded-lg bg-teal-600/80 hover:bg-teal-600 text-white font-medium px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/30 cursor-pointer transition-colors"
                    >
                      {exercisesFromSidebar.length === 0 && (
                        <option value="">No exercises available</option>
                      )}
                      {exercisesFromSidebar.map((ex) => (
                        <option key={ex.id} value={ex.name}>
                          {ex.name}
                        </option>
                      ))}
                    </select>
                    <span className="text-white">is</span>
                    <select
                      value={thenRestriction}
                      onChange={(e) => setThenRestriction(e.target.value)}
                      className="rounded-lg bg-teal-600/80 hover:bg-teal-600 text-white font-medium px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/30 cursor-pointer transition-colors"
                    >
                      {restrictions.map((restriction) => (
                        <option key={restriction} value={restriction}>
                          {restriction}
                        </option>
                      ))}
                    </select>
                    <span className="text-white">.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-8 pt-6 border-t border-white/10">
              <button
                onClick={handleClose}
                className="flex-1 rounded-lg bg-white/10 hover:bg-white/15 text-white font-semibold py-3 px-4 transition-colors focus:outline-none focus:ring-2 focus:ring-white/30"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 rounded-lg bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:shadow-lg hover:shadow-emerald-500/40 text-white font-semibold py-3 px-4 transition-all hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-950"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
