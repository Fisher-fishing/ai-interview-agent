async function request(path) {
  const response = await fetch(`/api${path}`, {
    credentials: "include",
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message || "获取题库失败，请稍后重试。",
    );
  }

  return data;
}

export function getInterviewRoles() {
  return request("/questions/roles");
}

export function getQuestions({
  roleKey,
  interviewType,
  difficulty = "",
  limit = 5,
}) {
  const parameters = new URLSearchParams({
    role: roleKey,
    interviewType,
    limit: String(limit),
  });

  if (difficulty) {
    parameters.set("difficulty", difficulty);
  }

  return request(`/questions?${parameters.toString()}`);
}