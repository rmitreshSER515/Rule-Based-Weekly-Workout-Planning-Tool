import { useEffect } from "react";

export type ShareableScheduleSummary = {
  id: string;
  title: string;
  startDate?: string;
  endDate?: string;
  exerciseCount?: number;
  selectedRuleCount?: number;
};

interface ShareSchedulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedules: ShareableScheduleSummary[];
}

const formatDateRange = (
  startDate?: string,
  endDate?: string,
): string => {
  if (startDate && endDate) {
    return `${startDate} to ${endDate}`;
  }

  if (startDate) {
    return `Starts ${startDate}`;
  }

  if (endDate) {
    return `Ends ${endDate}`;
  }

  return "No date range selected";
};

export default function ShareSchedulesModal({
  isOpen,
  onClose,
  schedules,
}: ShareSchedulesModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const heading = schedules.length === 1 ? "Share Schedule" : "Share Schedules";
  const summary =
    schedules.length === 1
      ? "Preview the schedule details that will be included when sharing is wired up."
      : `Previewing ${schedules.length} selected schedules for the future share flow.`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className="relative z-10 w-full max-w-4xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-schedules-heading"
      >
        <div className="overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 shadow-2xl">
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

          <div className="relative z-10 p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-200/80">
                  Share Preview
                </p>
                <h2
                  id="share-schedules-heading"
                  className="mt-3 text-3xl font-bold text-white"
                >
                  {heading}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">
                  {summary}
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-xl border border-white/15 bg-white/5 p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Close share preview"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.25"
                  strokeLinecap="round"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {schedules.map((schedule) => (
                <article
                  key={schedule.id}
                  className="rounded-2xl border border-white/12 bg-white/6 p-5 shadow-[0_12px_30px_rgba(0,0,0,0.22)] backdrop-blur-xl"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-100">
                      Schedule
                    </span>
                    <span className="text-xs text-white/35">{schedule.id}</span>
                  </div>

                  <h3 className="mt-4 line-clamp-2 text-xl font-bold text-white">
                    {schedule.title || "Untitled Schedule"}
                  </h3>

                  <dl className="mt-5 space-y-3 text-sm text-white/75">
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                      <dt className="text-xs uppercase tracking-[0.2em] text-white/40">
                        Date Range
                      </dt>
                      <dd className="mt-1 font-medium text-white">
                        {formatDateRange(schedule.startDate, schedule.endDate)}
                      </dd>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                        <dt className="text-xs uppercase tracking-[0.2em] text-white/40">
                          Exercises
                        </dt>
                        <dd className="mt-1 text-lg font-semibold text-white">
                          {schedule.exerciseCount ?? 0}
                        </dd>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                        <dt className="text-xs uppercase tracking-[0.2em] text-white/40">
                          Rules
                        </dt>
                        <dd className="mt-1 text-lg font-semibold text-white">
                          {schedule.selectedRuleCount ?? 0}
                        </dd>
                      </div>
                    </div>
                  </dl>
                </article>
              ))}
            </div>

            <div className="mt-8 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}