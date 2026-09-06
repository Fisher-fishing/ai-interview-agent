import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getInterviewRoles,
  getQuestions,
} from "../services/questionApi";

export function useQuestionBank() {
  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] =
    useState(true);
  const [rolesError, setRolesError] = useState("");

  const [questions, setQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] =
    useState(false);
  const [questionsError, setQuestionsError] =
    useState("");

  const loadRoles = useCallback(async () => {
    setRolesLoading(true);
    setRolesError("");

    try {
      const data = await getInterviewRoles();
      setRoles(data.roles);
    } catch (error) {
      setRolesError(error.message);
    } finally {
      setRolesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  const loadQuestions = useCallback(
    async (configuration) => {
      setQuestionsLoading(true);
      setQuestionsError("");
      setQuestions([]);

      try {
        const data = await getQuestions(configuration);
        setQuestions(data.questions);

        return data.questions;
      } catch (error) {
        setQuestionsError(error.message);
        throw error;
      } finally {
        setQuestionsLoading(false);
      }
    },
    [],
  );

  const clearQuestions = useCallback(() => {
    setQuestions([]);
    setQuestionsError("");
  }, []);

  return {
    roles,
    rolesLoading,
    rolesError,
    reloadRoles: loadRoles,
    questions,
    questionsLoading,
    questionsError,
    loadQuestions,
    clearQuestions,
  };
}