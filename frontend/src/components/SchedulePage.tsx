import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import CreateRuleModal from "./CreateRuleModal";
import { logout } from "../utils/auth";
import { fetchExercises, createExercise, type ExerciseDto } from "../api/exercises";
import { fetchRules, createRule, type RuleDto } from "../api/rules";
import { fetchSchedule, saveSchedule } from "../api/schedules";
import { getExerciseIcon } from "../utils/exerciseIcons";

type IntensityLevel = "recovery" | "easy" | "medium" | "hard" | "allOut";

const intensityMeta = (level: IntensityLevel): { label: string; scale: 1 | 2 | 3 | 4 | 5; pillClass: string } => {
  switch (level) {
    case "recovery":
      return {
        label: "Recovery",
        scale: 1,
        pillClass: "bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-400/30",
      };
    case "easy":
      return {
        label: "Easy",
        scale: 2,
        pillClass: "bg-lime-500/20 text-lime-200 ring-1 ring-lime-400/30",
      };
    case "medium":
      return {
        label: "Medium",
        scale: 3,
        pillClass: "bg-amber-500/20 text-amber-200 ring-1 ring-amber-400/30",
      };
    case "hard":
      return {
        label: "Hard",
        scale: 4,
        pillClass: "bg-orange-500/20 text-orange-200 ring-1 ring-orange-400/30",
      };
    case "allOut":
      return {
        label: "All-out effort",
        scale: 5,
        pillClass: "bg-red-500/20 text-red-200 ring-1 ring-red-400/30",
      };
  }
};

const dateKeyFromDateLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDateKeyLocal = (dateKey: string): Date => {
  const [year, month, day] = dateKey.split("-").map((value) => Number(value));
  return new Date(year, month - 1, day);
};

const normalizeIntensity = (value: string): IntensityLevel | null => {
  const normalized = value.trim().toLowerCase();

  if (normalized === "recovery") return "recovery";
  if (normalized === "easy") return "easy";
  if (normalized === "medium") return "medium";
  if (normalized === "hard") return "hard";
  if (
    normalized === "all-out effort" ||
    normalized === "all out effort" ||
    normalized === "all-out" ||
    normalized === "all out" ||
    normalized === "allout"
  ) {
    return "allOut";
  }

  return null;
};

const shiftDateKeyByDays = (dateKey: string, days: number): string => {
  const base = parseDateKeyLocal(dateKey);
  base.setDate(base.getDate() + days);
  return dateKeyFromDateLocal(base);
};

const getDaysInRange = (startDate: Date, endDate: Date): Date[] => {
  const days: Date[] = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return days;
};

const formatDayName = (date: Date): string => {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayName = days[date.getDay()];
  const month = date.toLocaleDateString("en-US", { month: "short" });
  const day = date.getDate();
  return `${dayName} ${day} ${month}`;
};

const EXERCISE_NAME_REGEX = /^[a-zA-Z0-9\s\-']+$/;
const EXERCISE_NAME_MAX_LENGTH = 25;

export default function SchedulePage() {
  const location = useLocation();
  const navigate = useNavigate();
  void location;

  const handleLogout = () => logout(navigate);

  const [rules, setRules] = useState<RuleDto[]>([]);
  const [selectedRuleIds, setSelectedRuleIds] = useState<string[]>([]);
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [ruleModalMode, setRuleModalMode] = useState<"create" | "edit">("create");
  const [editingRule, setEditingRule] = useState<RuleDto | null>(null);
  const [infoRule, setInfoRule] = useState<RuleDto | null>(null);

  // Initialize dates for current week
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 6);

  const [startDate, setStartDate] = useState<string>(
    dateKeyFromDateLocal(today)
  );
  const [endDate, setEndDate] = useState<string>(
    dateKeyFromDateLocal(nextWeek)
  );
  const [scheduleTitle, setScheduleTitle] = useState<string>("");
  const [isEditingTitle, setIsEditingTitle] = useState(true);
  const [titleDraft, setTitleDraft] = useState("");

  // Save-related state
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");
  const lastSavedSnapshotRef = useRef<string>("");
  const [scheduleLoaded, setScheduleLoaded] = useState(false);

  const handleTitleSave = () => {
    const trimmed = titleDraft.trim();
    if (!trimmed) return;
    setScheduleTitle(trimmed);
    setIsEditingTitle(false);
  };

  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [exerciseName, setExerciseName] = useState("");
  const [exerciseNotes, setExerciseNotes] = useState("");
  const [addExerciseNameError, setAddExerciseNameError] = useState("");
  const [exercises, setExercises] = useState<{ id: string; name: string; notes: string }[]>([]);

  const [userId, setUserId] = useState<string | null>(null);

  // Load authenticated user id from localStorage (set during login/register)
  useEffect(() => {
    try {
      const storedUserJson = localStorage.getItem("user");
      if (!storedUserJson) {
        setUserId(null);
        return;
      }
      const storedUser = JSON.parse(storedUserJson);
      const id = storedUser?.id ?? storedUser?._id ?? null;
      setUserId(typeof id === "string" ? id : null);
    } catch (err) {
      console.error("Failed to read stored user", err);
      setUserId(null);
    }
  }, []);

  // Load exercises for this user on mount
  useEffect(() => {
    if (!userId) {
      console.warn("No userId found; skipping exercise load");
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        const items = await fetchExercises(userId);
        if (cancelled) return;
        setExercises(
          items.map((ex: ExerciseDto) => ({
            id: ex.id,
            name: ex.name,
            notes: ex.notes,
          })),
        );
      } catch (err) {
        console.error("Failed to load exercises", err);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Load rules for this user
  useEffect(() => {
    if (!userId) {
      setRules([]);
      setSelectedRuleIds([]);
      return;
    }

    let cancelled = false;

    const loadRules = async () => {
      try {
        const items = await fetchRules(userId);
        if (cancelled) return;
        setRules(items);
      } catch (err) {
        console.error("Failed to load rules", err);
      }
    };

    loadRules();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Drag-and-drop state
  const [calendarExercises, setCalendarExercises] = useState<
    Record<string, {
      id: string;
      exerciseId: string;
      name: string;
      notes: string;
      intensity: IntensityLevel;
      duration: { hours: string; minutes: string };
    }[]>
  >({});
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  // Build a snapshot of saveable state for dirty-checking
  const getCurrentSnapshot = useCallback(() => {
    return JSON.stringify({
      title: scheduleTitle,
      startDate,
      endDate,
      selectedRuleIds,
      calendarExercises,
    });
  }, [scheduleTitle, startDate, endDate, selectedRuleIds, calendarExercises]);

  const hasUnsavedChanges = useMemo(() => {
    if (!scheduleLoaded) return false;
    if (!lastSavedSnapshotRef.current) return true; // never saved
    return getCurrentSnapshot() !== lastSavedSnapshotRef.current;
  }, [getCurrentSnapshot, scheduleLoaded]);

  // Load schedule from DB on mount
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    const loadSchedule = async () => {
      try {
        const saved = await fetchSchedule(userId);
        if (cancelled) return;
        if (saved) {
          setScheduleTitle(saved.title);
          setTitleDraft(saved.title);
          setIsEditingTitle(false);
          setStartDate(saved.startDate);
          setEndDate(saved.endDate);
          setSelectedRuleIds(saved.selectedRuleIds ?? []);
          const normalizedCalendarExercises = Object.fromEntries(
            Object.entries(saved.calendarExercises ?? {}).map(([dateKey, items]) => [
              dateKey,
              (items ?? []).map((item) => ({
                ...item,
                intensity: normalizeIntensity(String(item.intensity)) ?? "easy",
              })),
            ])
          );
          setCalendarExercises(normalizedCalendarExercises);
          // set the snapshot AFTER a tick so derived state picks it up
          setTimeout(() => {
            lastSavedSnapshotRef.current = JSON.stringify({
              title: saved.title,
              startDate: saved.startDate,
              endDate: saved.endDate,
              selectedRuleIds: saved.selectedRuleIds ?? [],
              calendarExercises: normalizedCalendarExercises,
            });
            setScheduleLoaded(true);
          }, 0);
        } else {
          setScheduleLoaded(true);
        }
      } catch (err) {
        console.error("Failed to load schedule", err);
        if (!cancelled) setScheduleLoaded(true);
      }
    };

    loadSchedule();
    return () => { cancelled = true; };
  }, [userId]);

  // Save handler
  const handleSaveChanges = useCallback(async () => {
    if (!userId || !scheduleTitle.trim()) return;
    setIsSaving(true);
    setSaveError("");
    setSaveSuccess(false);

    try {
      await saveSchedule({
        userId,
        title: scheduleTitle.trim(),
        startDate,
        endDate,
        selectedRuleIds,
        calendarExercises,
      });
      lastSavedSnapshotRef.current = getCurrentSnapshot();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: any) {
      console.error("Failed to save schedule", err);
      setSaveError(err?.message ?? "Failed to save");
      setTimeout(() => setSaveError(""), 4000);
    } finally {
      setIsSaving(false);
    }
  }, [userId, scheduleTitle, startDate, endDate, selectedRuleIds, calendarExercises, getCurrentSnapshot]);

  // Intensity & duration popup state
  const [pendingDrop, setPendingDrop] = useState<{
    exerciseId: string; name: string; notes: string; targetDateKey: string;
  } | null>(null);
  const [selectedIntensity, setSelectedIntensity] = useState<IntensityLevel>("recovery");
  const [durationHours, setDurationHours] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [violationMessage, setViolationMessage] = useState<string | null>(null);

  // Editing state (null = adding new, object = editing existing)
  const [editingItem, setEditingItem] = useState<{
    itemId: string; dateKey: string;
  } | null>(null);

  const getDateKey = (date: Date): string => {
    return dateKeyFromDateLocal(date);
  };

  // Sidebar drag start
  const handleSidebarDragStart = useCallback(
    (e: React.DragEvent, exercise: { id: string; name: string; notes: string }) => {
      e.dataTransfer.setData("application/exercise-id", exercise.id);
      e.dataTransfer.setData("application/source", "sidebar");
      e.dataTransfer.effectAllowed = "copy";
    },
    []
  );

  // Calendar card drag start (for moving between days)
  const handleCalendarDragStart = useCallback(
    (e: React.DragEvent, calendarItemId: string, sourceDate: string) => {
      e.dataTransfer.setData("application/calendar-item-id", calendarItemId);
      e.dataTransfer.setData("application/source", "calendar");
      e.dataTransfer.setData("application/source-date", sourceDate);
      e.dataTransfer.effectAllowed = "move";
    },
    []
  );

  const handleDragOver = useCallback((e: React.DragEvent, dateKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = e.dataTransfer.types.includes("application/calendar-item-id")
      ? "move"
      : "copy";
    setDragOverDate(dateKey);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only clear if actually leaving the drop zone (not entering a child)
    const relatedTarget = e.relatedTarget as HTMLElement | null;
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
      setDragOverDate(null);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetDateKey: string) => {
      e.preventDefault();
      setDragOverDate(null);

      const source = e.dataTransfer.getData("application/source");

      if (source === "sidebar") {
        // Copy from sidebar — open intensity popup first
        const exerciseId = e.dataTransfer.getData("application/exercise-id");
        const exercise = exercises.find((ex) => ex.id === exerciseId);
        if (!exercise) return;

        setPendingDrop({
          exerciseId: exercise.id,
          name: exercise.name,
          notes: exercise.notes,
          targetDateKey,
        });
      } else if (source === "calendar") {
        // Move between days
        const calendarItemId = e.dataTransfer.getData("application/calendar-item-id");
        const sourceDate = e.dataTransfer.getData("application/source-date");
        if (sourceDate === targetDateKey) return; // dropped on same day

        setCalendarExercises((prev) => {
          const sourceItems = prev[sourceDate] || [];
          const item = sourceItems.find((i) => i.id === calendarItemId);
          if (!item) return prev;

          return {
            ...prev,
            [sourceDate]: sourceItems.filter((i) => i.id !== calendarItemId),
            [targetDateKey]: [...(prev[targetDateKey] || []), item],
          };
        });
      }
    },
    [exercises]
  );

  const selectedRules = useMemo(
    () => rules.filter((rule) => selectedRuleIds.includes(rule.id)),
    [rules, selectedRuleIds]
  );
  const activeRules = useMemo(
    () => (selectedRules.length > 0 ? selectedRules : rules),
    [selectedRules, rules]
  );

  const ruleViolations = useMemo(() => {
    if (selectedRules.length === 0) return new Map<string, string>();

    const violations = new Map<string, string>();
    const addViolation = (itemId: string, message: string) => {
      if (!violations.has(itemId)) {
        violations.set(itemId, message);
      }
    };

    for (const rule of selectedRules) {
      if (rule.thenRestriction.trim().toLowerCase() !== "not allowed") continue;

      const ifIntensity = normalizeIntensity(rule.ifExercise);
      const thenIntensity = normalizeIntensity(rule.thenExercise);
      if (!ifIntensity || !thenIntensity) continue;

      const ifExerciseName = rule.ifActivityType.trim().toLowerCase();
      const thenExerciseName = rule.thenActivityType.trim().toLowerCase();
      const ifTiming = rule.ifTiming.trim().toLowerCase();

      for (const [dateKey, items] of Object.entries(calendarExercises)) {
        for (const ifItem of items) {
          if (
            ifItem.name.trim().toLowerCase() !== ifExerciseName ||
            ifItem.intensity !== ifIntensity
          ) {
            continue;
          }

          let thenDateKey = dateKey;
          if (ifTiming === "the day before") thenDateKey = shiftDateKeyByDays(dateKey, 1);
          if (ifTiming === "the day after") thenDateKey = shiftDateKeyByDays(dateKey, -1);

          const thenItems = calendarExercises[thenDateKey] || [];
          for (const thenItem of thenItems) {
            if (
              thenItem.name.trim().toLowerCase() !== thenExerciseName ||
              thenItem.intensity !== thenIntensity
            ) {
              continue;
            }

            addViolation(
              thenItem.id,
              `Rule violation: "${rule.name}" does not allow ${thenItem.name} (${thenItem.intensity}) on this day.`
            );
          }
        }
      }
    }

    return violations;
  }, [calendarExercises, selectedRules]);

  const hasRuleViolations = ruleViolations.size > 0;

  const validateRuleForPlacement = useCallback(
    ({
      itemId,
      exerciseName,
      intensity,
      dateKey,
    }: {
      itemId: string | null;
      exerciseName: string;
      intensity: IntensityLevel;
      dateKey: string;
    }): string | null => {
      const normalizedExerciseName = exerciseName.trim().toLowerCase();
      const relevantRules = activeRules.filter(
        (rule) => rule.thenRestriction.trim().toLowerCase() === "not allowed"
      );

      for (const rule of relevantRules) {
        const ifIntensity = normalizeIntensity(rule.ifExercise);
        const thenIntensity = normalizeIntensity(rule.thenExercise);
        if (!ifIntensity || !thenIntensity) continue;

        const ifExerciseName = rule.ifActivityType.trim().toLowerCase();
        const thenExerciseName = rule.thenActivityType.trim().toLowerCase();
        const ifTiming = rule.ifTiming.trim().toLowerCase();

        const candidateMatchesThen =
          normalizedExerciseName === thenExerciseName && intensity === thenIntensity;

        if (candidateMatchesThen) {
          let ifDateKey = dateKey;
          if (ifTiming === "the day before") ifDateKey = shiftDateKeyByDays(dateKey, -1);
          if (ifTiming === "the day after") ifDateKey = shiftDateKeyByDays(dateKey, 1);

          const hasMatchingIf = (calendarExercises[ifDateKey] || []).some((entry) => {
            if (entry.id === itemId) return false;
            return (
              entry.name.trim().toLowerCase() === ifExerciseName &&
              entry.intensity === ifIntensity
            );
          });

          if (hasMatchingIf) {
            return `Rule violation: "${rule.name}" does not allow ${exerciseName} (${intensity}) on this day.`;
          }
        }

        const candidateMatchesIf =
          normalizedExerciseName === ifExerciseName && intensity === ifIntensity;

        if (candidateMatchesIf) {
          let thenDateKey = dateKey;
          if (ifTiming === "the day before") thenDateKey = shiftDateKeyByDays(dateKey, 1);
          if (ifTiming === "the day after") thenDateKey = shiftDateKeyByDays(dateKey, -1);

          const hasBlockedThen = (calendarExercises[thenDateKey] || []).some((entry) => {
            if (entry.id === itemId) return false;
            return (
              entry.name.trim().toLowerCase() === thenExerciseName &&
              entry.intensity === thenIntensity
            );
          });

          if (hasBlockedThen) {
            return `Rule violation: "${rule.name}" conflicts with existing workouts around this day.`;
          }
        }
      }

      return null;
    },
    [calendarExercises, activeRules]
  );

  const removeCalendarExercise = useCallback((dateKey: string, itemId: string) => {
    setCalendarExercises((prev) => ({
      ...prev,
      [dateKey]: (prev[dateKey] || []).filter((i) => i.id !== itemId),
    }));
  }, []);

  // Intensity & duration popup handlers
  const handleDropSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const duration = { hours: durationHours.trim(), minutes: durationMinutes.trim() };

      if (editingItem) {
        const { itemId, dateKey } = editingItem;
        const currentItem = (calendarExercises[dateKey] || []).find((i) => i.id === itemId);
        if (!currentItem) return;

        const violation = validateRuleForPlacement({
          itemId,
          exerciseName: currentItem.name,
          intensity: selectedIntensity,
          dateKey,
        });

        if (violation) {
          setViolationMessage(violation);
          return;
        }

        setCalendarExercises((prev) => ({
          ...prev,
          [dateKey]: (prev[dateKey] || []).map((i) =>
            i.id === itemId ? { ...i, intensity: selectedIntensity, duration } : i
          ),
        }));
        setEditingItem(null);
        setPendingDrop(null);
      } else if (pendingDrop) {
        const { exerciseId, name, notes, targetDateKey } = pendingDrop;
        const violation = validateRuleForPlacement({
          itemId: null,
          exerciseName: name,
          intensity: selectedIntensity,
          dateKey: targetDateKey,
        });

        if (violation) {
          setViolationMessage(violation);
          return;
        }

        setCalendarExercises((prev) => ({
          ...prev,
          [targetDateKey]: [
            ...(prev[targetDateKey] || []),
            { id: crypto.randomUUID(), exerciseId, name, notes, intensity: selectedIntensity, duration },
          ],
        }));
        setPendingDrop(null);
      }

      setSelectedIntensity("recovery");
      setDurationHours("");
      setDurationMinutes("");
    },
    [
      pendingDrop,
      editingItem,
      selectedIntensity,
      durationHours,
      durationMinutes,
      calendarExercises,
      validateRuleForPlacement,
    ]
  );

  const handleIntensityCancel = useCallback(() => {
    setPendingDrop(null);
    setEditingItem(null);
    setSelectedIntensity("recovery");
    setDurationHours("");
    setDurationMinutes("");
  }, []);

  const closeViolationPopup = useCallback(() => {
    setViolationMessage(null);
  }, []);

  const getViolationMessage = useCallback(
    (itemId: string) => ruleViolations.get(itemId) ?? null,
    [ruleViolations]
  );

  const openEditPopup = useCallback(
    (dateKey: string, item: {
      id: string;
      name: string;
      intensity: IntensityLevel;
      duration: { hours: string; minutes: string };
    }) => {
      setEditingItem({ itemId: item.id, dateKey });
      setPendingDrop({ exerciseId: "", name: item.name, notes: "", targetDateKey: dateKey });
      setSelectedIntensity(item.intensity);
      setDurationHours(item.duration.hours);
      setDurationMinutes(item.duration.minutes);
    },
    []
  );

  const openAddExerciseModal = () => {
    setExerciseName("");
    setExerciseNotes("");
    setAddExerciseNameError("");
    setShowAddExerciseModal(true);
  };

  const closeAddExerciseModal = () => {
    setShowAddExerciseModal(false);
    setExerciseName("");
    setExerciseNotes("");
    setAddExerciseNameError("");
  };

  const handleAddExerciseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = exerciseName.trim();
    setAddExerciseNameError("");

    if (!name || !userId) return;

    if (name.length > EXERCISE_NAME_MAX_LENGTH) {
      setAddExerciseNameError(`Name must be ${EXERCISE_NAME_MAX_LENGTH} characters or fewer`);
      return;
    }
    if (!EXERCISE_NAME_REGEX.test(name)) {
      setAddExerciseNameError(
        "Name can only contain letters, numbers, spaces, hyphens, and apostrophes"
      );
      return;
    }

    const isDuplicate = exercises.some(
      (ex) => ex.name.trim().toLowerCase() === name.toLowerCase()
    );
    if (isDuplicate) {
      setAddExerciseNameError("An exercise with this name already exists");
      return;
    }

    try {
      const created = await createExercise({
        userId,
        name,
        notes: exerciseNotes.trim(),
      });

      setExercises((prev) => [
        ...prev,
        { id: created.id, name: created.name, notes: created.notes },
      ]);
      closeAddExerciseModal();
    } catch (err: any) {
      setAddExerciseNameError(err?.message ?? "Failed to create exercise");
    }
  };

  const days = useMemo(() => {
    const start = parseDateKeyLocal(startDate);
    const end = parseDateKeyLocal(endDate);
    return getDaysInRange(start, end);
  }, [startDate, endDate]);

  const weeks = useMemo(() => {
    const result: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      result.push(days.slice(i, i + 7));
    }
    return result;
  }, [days]);

  const toggleRuleSelection = (ruleId: string) => {
    setSelectedRuleIds((prev) =>
      prev.includes(ruleId) ? prev.filter((id) => id !== ruleId) : [...prev, ruleId]
    );
  };

  type RuleData = {
    name: string;
    ifExercise: string;
    ifActivityType: string;
    ifTiming: string;
    thenExercise: string;
    thenActivityType: string;
    thenRestriction: string;
  };

  const findDuplicateRule = useCallback(
    (ruleData: RuleData, excludeId: string | null): { duplicateName: RuleDto | null; duplicateCriteria: RuleDto | null } => {
      let duplicateName: RuleDto | null = null;
      let duplicateCriteria: RuleDto | null = null;
      const nameLower = ruleData.name.trim().toLowerCase();
      for (const r of rules) {
        if (r.id === excludeId) continue;
        if (r.name.trim().toLowerCase() === nameLower) duplicateName = r;
        const sameCriteria =
          r.ifExercise === ruleData.ifExercise &&
          r.ifActivityType === ruleData.ifActivityType &&
          r.ifTiming === ruleData.ifTiming &&
          r.thenExercise === ruleData.thenExercise &&
          r.thenActivityType === ruleData.thenActivityType &&
          r.thenRestriction === ruleData.thenRestriction;
        if (sameCriteria) duplicateCriteria = r;
        if (duplicateName && duplicateCriteria) break;
      }
      return { duplicateName, duplicateCriteria };
    },
    [rules]
  );

  const handleSaveRule = async (ruleData: RuleData) => {
    if (!userId) return;

    const { duplicateName, duplicateCriteria } = findDuplicateRule(ruleData, null);
    if (duplicateName) {
      alert(`Can't create rule because a rule with this name already exists: ${duplicateName.name}`);
      return;
    }
    if (duplicateCriteria) {
      alert(`Can't create rule because rule already exists: ${duplicateCriteria.name}`);
      return;
    }

    try {
      const created = await createRule({
        userId,
        ...ruleData,
      });

      setRules((prev) => [...prev, created]);
      setIsRuleModalOpen(false);
    } catch (err) {
      console.error("Failed to create rule", err);
    }
  };

  const handleEditRuleSave = async (ruleData: RuleData) => {
    if (!editingRule) return;

    const { duplicateName, duplicateCriteria } = findDuplicateRule(ruleData, editingRule.id);
    if (duplicateName) {
      alert(`Can't create rule because a rule with this name already exists: ${duplicateName.name}`);
      return;
    }
    if (duplicateCriteria) {
      alert(`Can't create rule because rule already exists: ${duplicateCriteria.name}`);
      return;
    }

    setRules((prev) =>
      prev.map((r) =>
        r.id === editingRule.id
          ? {
              ...r,
              ...ruleData,
            }
          : r
      )
    );

    setEditingRule(null);
    setRuleModalMode("create");
    setIsRuleModalOpen(false);
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-slate-950 flex">
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

      {/* Left Sidebar */}
      <div className="relative z-10 w-[300px] flex flex-col border-r border-white/15 bg-white/5 backdrop-blur-xl">

      <div className="px-4 pt-4 pb-2">
    <button
      type="button"
      onClick={() => navigate("/fitness")}
      className="flex items-center gap-1.5 text-white/40 hover:text-white/80 text-xs font-medium transition-colors duration-200 group w-fit"
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
        <path
          d="M19 12H5M5 12l7 7M5 12l7-7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="group-hover:underline underline-offset-2 tracking-wide uppercase">
        Compare/create new schedules
      </span>
    </button>
  </div>

        {/* Exercises Panel */}
        <div className="flex flex-col h-1/2 border-b border-white/15">
          <div className="p-4">
            <button className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 text-center">
              Exercises
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
            {exercises.length > 0 ? exercises.map((ex) => (
              <div
                key={ex.id}
                draggable
                onDragStart={(e) => handleSidebarDragStart(e, ex)}
                className="rounded-lg bg-orange-500/20 border border-orange-400/30 px-3 py-2 cursor-grab active:cursor-grabbing select-none transition-all duration-150 hover:bg-orange-500/30 hover:border-orange-400/50 hover:shadow-lg hover:shadow-orange-500/10"
              >
                <div className="flex items-start gap-2">
                  {/* Grip handle */}
                  <svg
                    className="w-4 h-4 mt-0.5 shrink-0 text-white/40"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <circle cx="9" cy="5" r="1.5" />
                    <circle cx="15" cy="5" r="1.5" />
                    <circle cx="9" cy="12" r="1.5" />
                    <circle cx="15" cy="12" r="1.5" />
                    <circle cx="9" cy="19" r="1.5" />
                    <circle cx="15" cy="19" r="1.5" />
                  </svg>
                  <span className="w-5 h-5 mt-0.5 text-white/80">
                    {getExerciseIcon(ex.name, "20")}
                  </span>
                  <div className="min-w-0">
                    <p className="text-white font-medium text-sm">{ex.name}</p>
                    {ex.notes ? (
                      <p className="text-white/70 text-xs mt-1">{ex.notes}</p>
                    ) : null}
                  </div>
                </div>
              </div>
            )) : (
              <p className="text-white/50 text-sm">No exercises yet. Add one to get started.</p>
            )}
          </div>
          <div className="shrink-0 p-4 pt-0">
            <button
              type="button"
              onClick={openAddExerciseModal}
              className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 text-center flex items-center justify-center gap-2"
              aria-label="Add exercise"
            >
              <span aria-hidden>+</span>
              <span>Add exercise</span>
            </button>
          </div>
        </div>

        {/* Rules Panel */}
        <div className="flex flex-col h-1/2">
          <div className="p-4">
            <button
              className="w-full rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-4 text-center"
            >
              Rules
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {rules.length > 0 ? (
              <div className="space-y-2">
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-start gap-3 p-2 rounded-lg bg-white/5 border border-white/10"
                  >
                    <input
                      type="checkbox"
                      checked={selectedRuleIds.includes(rule.id)}
                      onChange={() => toggleRuleSelection(rule.id)}
                      className="mt-1 w-4 h-4 rounded border-white/30 bg-white/10 accent-teal-500 cursor-pointer"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-medium text-sm truncate">{rule.name}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setInfoRule(rule)}
                      className="shrink-0 rounded-md p-1 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                      aria-label={`Rule details for ${rule.name}`}
                      title="Rule details"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.25"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 16v-4" />
                        <path d="M12 8h.01" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-white/50 text-sm">No rules yet. Add one to get started.</p>
            )}
          </div>
          <div className="shrink-0 p-4 pt-0">
            <button
              type="button"
              onClick={() => {
                setRuleModalMode("create");
                setEditingRule(null);
                setIsRuleModalOpen(true);
              }}
              className="w-full rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-4 text-center flex items-center justify-center gap-2"
              aria-label="Add rule"
            >
              <span aria-hidden>+</span>
              <span>Add rule</span>
            </button>
          </div>
        </div>
      </div>

      {/* Right Side - Calendar */}
      <div className="relative z-10 flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header - shrink-0 so it never disappears */}
        <div className="shrink-0 p-4 border-b border-white/15 bg-white/5 backdrop-blur-xl">
          <div className="flex flex-nowrap items-center justify-between gap-4 mb-4">
            <div className="flex min-w-0 shrink items-center gap-2">
              {isEditingTitle ? (
                <div className="flex items-center gap-2 min-w-0">
                  <input
                    autoFocus
                    type="text"
                    value={titleDraft}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleTitleSave();
                      if (e.key === "Escape") {
                        if (scheduleTitle) {
                          setTitleDraft(scheduleTitle);
                          setIsEditingTitle(false);
                        }
                      }
                    }}
                    onBlur={handleTitleSave}
                    placeholder="Name your schedule..."
                    className="text-2xl font-bold bg-transparent border-b-2 border-white/50 focus:border-white text-white placeholder-white/30 outline-none min-w-0 w-64"
                  />
                </div>
              ) : (
                <>
                  <h1
                    className="truncate text-2xl font-bold text-white cursor-pointer hover:text-white/80 transition-colors"
                    onClick={() => {
                      setTitleDraft(scheduleTitle);
                      setIsEditingTitle(true);
                    }}
                    title="Click to rename"
                  >
                    {scheduleTitle}
                  </h1>
                  <button
                    onClick={() => {
                      setTitleDraft(scheduleTitle);
                      setIsEditingTitle(true);
                    }}
                    className="text-white/40 hover:text-white/80 transition-colors"
                    title="Rename schedule"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                </>
              )}
            </div>
            <div className="shrink-0 flex items-center gap-3">
              {/* Unsaved changes prompt */}
              {hasUnsavedChanges && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 border border-amber-400/30 px-3 py-1.5 text-xs font-medium text-amber-300 animate-pulse">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  Unsaved changes
                </span>
              )}
              {/* Save success badge */}
              {saveSuccess && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-3 py-1.5 text-xs font-medium text-emerald-300">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Saved!
                </span>
              )}
              {/* Save error badge */}
              {saveError && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/20 border border-red-400/30 px-3 py-1.5 text-xs font-medium text-red-300">
                  {saveError}
                </span>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="relative z-10 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white/90 hover:bg-white/10 hover:text-white cursor-pointer transition-colors"
              >
                Log out
              </button>
              <button
                type="button"
                onClick={handleSaveChanges}
                disabled={isSaving || !scheduleTitle.trim() || hasRuleViolations}
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 px-6 py-3 font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                {isSaving ? (
                  <svg className="h-5 w-5 shrink-0 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg
                    className="h-5 w-5 shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                  </svg>
                )}
                <span>{isSaving ? "Saving..." : "Save Changes"}</span>
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-white/70 text-sm">Start:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-lg bg-white/10 border border-white/15 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-white/70 text-sm">End:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-lg bg-white/10 border border-white/15 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>
          </div>
        </div>

        {/* Calendar Grid - one week visible per scroll, 7 days fit equally */}
        <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
          <div
            className="schedule-calendar-scroll mx-auto flex-1 min-h-0 w-full max-w-[1280px] overflow-x-auto overflow-y-hidden scroll-smooth [container-type:inline-size]"
            style={{
              scrollSnapType: weeks.length > 1 ? "x mandatory" : undefined,
              scrollbarGutter: "stable",
            }}
          >
            <div className="flex h-full min-w-fit">
              {weeks.map((weekDays, weekIndex) => (
                <div
                  key={weekIndex}
                  className="flex shrink-0 w-[100cqw]"
                  style={{ scrollSnapAlign: "start" }}
                >
                  {weekDays.map((day, dayIndex) => (
                    <div
                      key={dayIndex}
                      className="min-w-0 flex-1 flex flex-col border-r border-white/15 bg-white/5 backdrop-blur-xl"
                    >
                      {/* Day Header */}
                      <div className="p-3 border-b border-white/15">
                        <button className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 text-center text-sm">
                          {formatDayName(day)}
                        </button>
                      </div>
                      {/* Day Body - Drop Target */}
                      <div
                        className={`flex-1 overflow-y-auto p-2 min-h-[400px] transition-colors duration-200 ${dragOverDate === getDateKey(day)
                          ? "bg-blue-500/15 ring-2 ring-inset ring-blue-400/50"
                          : ""
                          }`}
                        onDragOver={(e) => handleDragOver(e, getDateKey(day))}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, getDateKey(day))}
                      >
                        {(calendarExercises[getDateKey(day)] || []).map((item) => {
                          const itemViolation = getViolationMessage(item.id);
                          return (
                            <div
                              key={item.id}
                              draggable
                              onDragStart={(e) =>
                                handleCalendarDragStart(e, item.id, getDateKey(day))
                              }
                              className={`mb-2 rounded-lg border px-2.5 py-1.5 cursor-grab active:cursor-grabbing select-none group transition-all duration-150 ${itemViolation
                                  ? "bg-red-500/15 border-red-400/30 hover:bg-red-500/20"
                                  : "bg-orange-500/20 border-orange-400/30 hover:bg-orange-500/30 hover:border-orange-400/50"
                                }`}
                            >
                              <div className="flex items-start justify-between gap-1">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="w-4 h-4 text-white/80">
                                      {getExerciseIcon(item.name, "16")}
                                    </span>
                                    <p className="text-white font-medium text-xs leading-snug">
                                      {item.name}
                                    </p>
                                    <span className={`shrink-0 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none ${intensityMeta(item.intensity).pillClass}`}>
                                      {intensityMeta(item.intensity).scale}
                                    </span>
                                    {(item.duration.hours || item.duration.minutes) && (
                                      <span className="shrink-0 inline-block rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] font-medium leading-none text-white/70 ring-1 ring-white/15">
                                        {item.duration.hours ? `${item.duration.hours}h` : ""}
                                        {item.duration.hours && item.duration.minutes ? " " : ""}
                                        {item.duration.minutes ? `${item.duration.minutes}m` : ""}
                                      </span>
                                    )}
                                    {itemViolation && (
                                      <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-red-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-red-200 ring-1 ring-red-400/40">
                                          <svg
                                            className="h-3 w-3"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          >
                                            <path d="M12 9v4" />
                                            <path d="M12 17h.01" />
                                            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                          </svg>
                                          !
                                      </span>
                                    )}
                                  </div>
                                  {itemViolation ? (
                                    <div className="mt-1 overflow-hidden max-h-0 opacity-0 transition-all duration-200 group-hover:max-h-24 group-hover:opacity-100">
                                      <div className="rounded-md border border-red-400/30 bg-red-500/10 px-2 py-1.5 text-[11px] leading-snug text-red-200">
                                        {itemViolation}
                                      </div>
                                    </div>
                                  ) : item.notes ? (
                                    <p className="text-white/60 text-[11px] mt-0.5 leading-snug">
                                      {item.notes}
                                    </p>
                                  ) : null}
                                </div>
                                <div className="shrink-0 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openEditPopup(getDateKey(day), item)
                                    }
                                    className="rounded p-0.5 hover:bg-blue-500/30 text-white/50 hover:text-blue-300"
                                    aria-label={`Edit ${item.name}`}
                                  >
                                    <svg
                                      className="w-3.5 h-3.5"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2.5"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                    </svg>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeCalendarExercise(getDateKey(day), item.id)
                                    }
                                    className="rounded p-0.5 hover:bg-red-500/30 text-white/50 hover:text-red-300"
                                    aria-label={`Remove ${item.name}`}
                                  >
                                    <svg
                                      className="w-3.5 h-3.5"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2.5"
                                      strokeLinecap="round"
                                    >
                                      <path d="M18 6L6 18M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {dragOverDate === getDateKey(day) && (
                          <div className="rounded-lg border-2 border-dashed border-blue-400/40 py-3 flex items-center justify-center">
                            <p className="text-blue-300/70 text-xs font-medium">Drop here</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Intensity & Duration Popup */}
      {(pendingDrop || editingItem) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={handleIntensityCancel}
        >
          <div
            className="relative w-full max-w-sm rounded-2xl border border-white/15 bg-slate-900 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleDropSubmit} className="p-6">
              <h2 className="text-xl font-bold text-white mb-1">Exercise Details</h2>
              <p className="text-white/50 text-sm mb-5">
                Set intensity and duration for{" "}
                <span className="text-white font-medium">{pendingDrop?.name}</span>
              </p>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="drop-intensity"
                    className="block text-sm font-medium text-white/80 mb-1"
                  >
                    Intensity
                  </label>
                  <select
                    id="drop-intensity"
                    value={selectedIntensity}
                    onChange={(e) =>
                      setSelectedIntensity(e.target.value as IntensityLevel)
                    }
                    className="w-full rounded-lg bg-white/10 border border-white/15 text-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                  >
                    <option value="recovery" className="bg-slate-900 text-white">
                      1 — Recovery
                    </option>
                    <option value="easy" className="bg-slate-900 text-white">
                      2 — Easy
                    </option>
                    <option value="medium" className="bg-slate-900 text-white">
                      3 — Medium
                    </option>
                    <option value="hard" className="bg-slate-900 text-white">
                      4 — Hard
                    </option>
                    <option value="allOut" className="bg-slate-900 text-white">
                      5 — All-out effort
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">
                    Duration
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <input
                        id="drop-duration-hours"
                        type="number"
                        min="0"
                        max="23"
                        value={durationHours}
                        onChange={(e) =>
                          setDurationHours(e.target.value.replace(/[^0-9]/g, ""))
                        }
                        placeholder="0"
                        className="w-full rounded-lg bg-white/10 border border-white/15 text-white placeholder-white/40 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="block text-[11px] text-white/40 mt-1 text-center">
                        Hours
                      </span>
                    </div>
                    <span className="text-white/50 font-bold text-lg pb-5">:</span>
                    <div className="flex-1">
                      <input
                        id="drop-duration-minutes"
                        type="number"
                        min="0"
                        max="59"
                        value={durationMinutes}
                        onChange={(e) =>
                          setDurationMinutes(e.target.value.replace(/[^0-9]/g, ""))
                        }
                        placeholder="0"
                        className="w-full rounded-lg bg-white/10 border border-white/15 text-white placeholder-white/40 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="block text-[11px] text-white/40 mt-1 text-center">
                        Minutes
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button
                  type="button"
                  onClick={handleIntensityCancel}
                  className="flex-1 rounded-lg border border-white/20 bg-white/5 text-white py-2.5 font-medium hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white py-2.5 font-medium transition-colors"
                >
                  {editingItem ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rule Violation Popup */}
      {violationMessage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={closeViolationPopup}
        >
          <div
            className="relative w-full max-w-md rounded-2xl border border-red-400/30 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-red-500/25" />
            <div className="relative p-6">
              <div className="flex items-start gap-3">
                <div className="shrink-0 rounded-full bg-red-500/15 p-2 ring-1 ring-red-400/40">
                  <svg
                    className="h-5 w-5 text-red-300"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 9v4" />
                    <path d="M12 17h.01" />
                    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold text-white">Rule violation</h3>
                  <p className="mt-1 text-sm text-white/70">{violationMessage}</p>
                </div>
              </div>
              <div className="mt-5 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeViolationPopup}
                  className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10 transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={closeViolationPopup}
                  className="rounded-lg bg-gradient-to-r from-rose-500 via-red-500 to-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transition-all"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Exercise Modal */}
      {showAddExerciseModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={closeAddExerciseModal}
        >
          <div
            className="relative w-full max-w-md rounded-2xl border border-white/15 bg-slate-900 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-4">Add exercise</h2>
              <form onSubmit={handleAddExerciseSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="exercise-name"
                    className="block text-sm font-medium text-white/80 mb-1"
                  >
                    Name (max {EXERCISE_NAME_MAX_LENGTH} characters)
                  </label>
                  <input
                    id="exercise-name"
                    type="text"
                    value={exerciseName}
                    onChange={(e) => {
                      setExerciseName(e.target.value);
                      if (addExerciseNameError) setAddExerciseNameError("");
                    }}
                    placeholder="e.g. Running"
                    maxLength={EXERCISE_NAME_MAX_LENGTH}
                    className={`w-full rounded-lg bg-white/10 border text-white placeholder-white/40 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${addExerciseNameError
                      ? "border-red-400 focus:ring-red-500"
                      : "border-white/15"
                      }`}
                    autoFocus
                  />
                  {addExerciseNameError && (
                    <p className="text-red-400 text-xs mt-1.5">{addExerciseNameError}</p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="exercise-notes"
                    className="block text-sm font-medium text-white/80 mb-1"
                  >
                    Notes
                  </label>
                  <textarea
                    id="exercise-notes"
                    value={exerciseNotes}
                    onChange={(e) => setExerciseNotes(e.target.value)}
                    placeholder="Optional notes..."
                    rows={3}
                    className="w-full rounded-lg bg-white/10 border border-white/15 text-white placeholder-white/40 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeAddExerciseModal}
                    className="flex-1 rounded-lg border border-white/20 bg-white/5 text-white py-2.5 font-medium hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      !exerciseName.trim() ||
                      exerciseName.trim().length > EXERCISE_NAME_MAX_LENGTH ||
                      !EXERCISE_NAME_REGEX.test(exerciseName.trim())
                    }
                    className="flex-1 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 font-medium"
                  >
                    Add
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Rule info popup */}
      {infoRule && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setInfoRule(null)}
        >
          <div
            className="relative w-full max-w-lg rounded-2xl border border-white/15 bg-slate-900 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-xl font-bold text-white truncate">{infoRule.name}</h2>
                  <p className="text-white/60 text-sm mt-1">
                    If {infoRule.ifExercise} {infoRule.ifActivityType} {infoRule.ifTiming}, then{" "}
                    {infoRule.thenExercise} {infoRule.thenActivityType} is {infoRule.thenRestriction}.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setInfoRule(null)}
                  className="shrink-0 rounded-md p-2 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Close rule details"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round">
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setInfoRule(null)}
                  className="flex-1 rounded-lg border border-white/20 bg-white/5 text-white py-2.5 font-medium hover:bg-white/10 transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingRule(infoRule);
                    setRuleModalMode("edit");
                    setIsRuleModalOpen(true);
                    setInfoRule(null);
                  }}
                  className="flex-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white py-2.5 font-semibold transition-colors"
                >
                  Edit rule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Rule Modal */}
      {isRuleModalOpen && (
        <CreateRuleModal
          isOpen={isRuleModalOpen}
          onClose={() => {
            setIsRuleModalOpen(false);
            setEditingRule(null);
            setRuleModalMode("create");
          }}
          mode={ruleModalMode}
          initialRule={
            editingRule
              ? {
                  name: editingRule.name,
                  ifExercise: editingRule.ifExercise,
                  ifActivityType: editingRule.ifActivityType,
                  ifTiming: editingRule.ifTiming,
                  thenExercise: editingRule.thenExercise,
                  thenActivityType: editingRule.thenActivityType,
                  thenRestriction: editingRule.thenRestriction,
                }
              : undefined
          }
          onSave={ruleModalMode === "edit" ? handleEditRuleSave : handleSaveRule}
          exercisesFromSidebar={exercises}
        />
      )}
    </div>
  );
}
