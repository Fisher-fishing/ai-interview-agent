import { useEffect, useState } from "react";

const STORAGE_KEY = "ai-interview-agent-history";

function readHistory() {
  try {
    const savedHistory = localStorage.getItem(STORAGE_KEY);
    const parsedHistory = savedHistory ? JSON.parse(savedHistory) : [];

    return Array.isArray(parsedHistory) ? parsedHistory : [];
  } catch {
    return [];
  }
}

export function useInterviewHistory() {
  const [history, setHistory] = useState(readHistory);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  function addHistory(record) {
    const id =
      globalThis.crypto?.randomUUID?.() ?? String(Date.now());

    setHistory((currentHistory) =>
      [
        {
          ...record,
          id,
          createdAt: new Date().toISOString(),
        },
        ...currentHistory,
      ].slice(0, 10),
    );
  }

  function clearHistory() {
    setHistory([]);
  }

  return {
    history,
    addHistory,
    clearHistory,
  };
}