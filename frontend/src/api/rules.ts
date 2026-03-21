const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export type RuleDto = {
  id: string;
  userId: string;
  name: string;
  ifExercise: string;
  ifActivityType: string;
  ifTiming: string;
  thenExercise: string;
  thenActivityType: string;
  thenRestriction: string;
};

export type CreateRuleInput = {
  userId: string;
  name: string;
  ifExercise: string;
  ifActivityType: string;
  ifTiming: string;
  thenExercise: string;
  thenActivityType: string;
  thenRestriction: string;
};

export async function fetchRules(userId: string): Promise<RuleDto[]> {
  const url = new URL("/rules", API_URL);
  url.searchParams.set("userId", userId);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error("Failed to load rules");
  }

  const data = (await res.json()) as RuleDto[];
  return data;
}

export async function createRule(input: CreateRuleInput): Promise<RuleDto> {
  const res = await fetch(`${API_URL}/rules`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.message ?? "Failed to create rule");
  }

  return data as RuleDto;
}

export async function updateRule(id: string, input: CreateRuleInput): Promise<RuleDto> {
  const res = await fetch(`${API_URL}/rules/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.message ?? "Failed to update rule");
  }

  return data as RuleDto;
}

