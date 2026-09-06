async function request(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    credentials: "include",
    ...options,
    headers: {
      ...(options.body
        ? { "Content-Type": "application/json" }
        : {}),
      ...options.headers,
    },
  });

  const data =
    response.status === 204
      ? null
      : await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message || "请求失败，请稍后重试。",
    );
  }

  return data;
}

export function getInterviews() {
  return request("/interviews");
}

export function getInterview(interviewId) {
  return request(`/interviews/${interviewId}`);
}

export function createInterview(interview) {
  return request("/interviews", {
    method: "POST",
    body: JSON.stringify(interview),
  });
}

export function clearInterviews() {
  return request("/interviews", {
    method: "DELETE",
  });
}
