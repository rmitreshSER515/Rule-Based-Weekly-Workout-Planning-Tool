const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export type ExerciseDto = {
  id: string;
  userId: string;
  name: string;
  notes: string;
};

export async function fetchExercises(userId: string): Promise<ExerciseDto[]> {
  const url = new URL("/exercises", API_URL);
  url.searchParams.set("userId", userId);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error("Failed to load exercises");
  }

  const data = (await res.json()) as ExerciseDto[];
  return data;
}

export async function createExercise(input: {
  userId: string;
  name: string;
  notes: string;
}): Promise<ExerciseDto> {
  const res = await fetch(`${API_URL}/exercises`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.message ?? "Failed to create exercise");
  }

  return data as ExerciseDto;
}

