import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  clearInterviews,
  createInterview,
  getInterviews,
} from "../services/interviewApi";

export function useInterviewHistory() {
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] =
    useState(true);
  const [historyError, setHistoryError] =
    useState("");

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError("");

    try {
      const data = await getInterviews();
      setHistory(data.interviews);
    } catch (error) {
      setHistoryError(error.message);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  async function addHistory(record) {
    setHistoryError("");

    try {
      const data = await createInterview(record);

      setHistory((currentHistory) =>
        [
          data.interview,
          ...currentHistory,
        ].slice(0, 20),
      );

      return data.interview;
    } catch (error) {
      setHistoryError(error.message);
      throw error;
    }
  }

  async function clearHistory() {
    setHistoryError("");

    try {
      await clearInterviews();
      setHistory([]);
    } catch (error) {
      setHistoryError(error.message);
    }
  }

  return {
    history,
    historyLoading,
    historyError,
    addHistory,
    clearHistory,
    loadHistory,
  };
}