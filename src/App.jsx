import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  InterviewHistory,
} from "./components/InterviewHistory";

import { useAuth } from "./context/AuthContext";
import { CustomSelect } from "./components/CustomSelect";
import { useInterviewHistory } from "./hooks/useInterviewHistory";
import { useQuestionBank } from "./hooks/useQuestionBank";

const INTERVIEW_TYPES = [
  "技术面试",
  "项目面试",
  "综合面试",
];

const INTERVIEW_TYPE_OPTIONS = INTERVIEW_TYPES.map((type) => ({
  value: type,
  label: type,
}));

export default function App() {
  const { user, logout } = useAuth();

  const {
    roles,
    rolesLoading,
    rolesError,
    reloadRoles,
    questions,
    questionsLoading,
    questionsError,
    loadQuestions,
    clearQuestions,
  } = useQuestionBank();

  const {
    history,
    historyLoading,
    historyError,
    addHistory,
    clearHistory,
  } = useInterviewHistory();

  const [role, setRole] = useState("");
  const [interviewType, setInterviewType] =
    useState("技术面试");
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [answers, setAnswers] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!role && roles.length > 0) {
      setRole(roles[0].roleKey);
    }
  }, [role, roles]);

  const selectedRole = useMemo(
    () =>
      roles.find((item) => item.roleKey === role) ??
      null,
    [role, roles],
  );

  const roleOptions = useMemo(
    () =>
      roles.map((item) => ({
        value: item.roleKey,
        label: `${item.displayName}（${item.questionCount}题）`,
      })),
    [roles],
  );

  const currentQuestion = questions[currentIndex];

  async function startInterview() {
    if (!role) {
      setError("请先选择目标岗位。");
      return;
    }

    setError("");
    setCompleted(false);
    setCurrentIndex(0);
    setAnswer("");
    setAnswers([]);

    try {
      const loadedQuestions = await loadQuestions({
        roleKey: role,
        interviewType,
        limit: 5,
      });

      if (loadedQuestions.length === 0) {
        setError("当前条件下暂时没有可用题目。");
        return;
      }

      setStarted(true);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function submitAnswer(event) {
    event.preventDefault();

    const normalizedAnswer = answer.trim();

    if (!normalizedAnswer) {
      setError("请先填写你的回答。");
      return;
    }

    if (!currentQuestion) {
      setError("当前题目不存在，请重新开始练习。");
      return;
    }

    const nextAnswers = [
      ...answers,
      {
        questionId: currentQuestion.id,
        question: currentQuestion.questionText,
        answer: normalizedAnswer,
      },
    ];

    setError("");

    if (currentIndex === questions.length - 1) {
      setSaving(true);

      try {
        await addHistory({
          role:
            selectedRole?.displayName ??
            "未知岗位",
          interviewType,
          answers: nextAnswers,
        });

        setAnswers(nextAnswers);
        setCompleted(true);
        setAnswer("");
      } catch {
        setError("保存面试记录失败，请稍后重试。");
      } finally {
        setSaving(false);
      }

      return;
    }

    setAnswers(nextAnswers);
    setCurrentIndex((index) => index + 1);
    setAnswer("");
  }

  function resetInterview() {
    setStarted(false);
    setCompleted(false);
    setCurrentIndex(0);
    setAnswer("");
    setAnswers([]);
    setError("");
    clearQuestions();
  }

  return (
    <div className="app">
      <header className="site-header">
        <div className="brand-group">
          <a
            className="brand"
            href="/"
            aria-label="返回首页"
          >
            Interview Agent
          </a>

          <span className="project-label">
            个人练习项目
          </span>
        </div>

        <div className="account-actions">
          <span>{user.email}</span>

          <button type="button" onClick={logout}>
            退出登录
          </button>
        </div>
      </header>

      <main className="page">
        <section className="hero">
          <p className="eyebrow">
            AI INTERVIEW PRACTICE
          </p>

          <h1>
            让每一次模拟面试都有清晰的练习记录
          </h1>

          <p className="hero-description">
            从MySQL题库中按目标岗位随机抽题，完成模拟问答并保存练习记录，
            为后续接入AI分析与反馈功能做好准备。
          </p>
        </section>

        <section className="workspace">
          <aside className="panel configuration-panel">
            <div>
              <p className="section-number">01</p>
              <h2>面试配置</h2>

              <p className="section-description">
                选择目标岗位和本次练习类型，每次随机抽取5题。
              </p>
            </div>

            <CustomSelect
              id="role-select"
              label="目标岗位"
              value={role}
              options={roleOptions}
              placeholder={
                rolesLoading
                  ? "正在加载岗位……"
                  : "暂无可用岗位"
              }
              disabled={started || rolesLoading}
              onChange={(nextRole) => {
                setRole(nextRole);
                setError("");
              }}
            />

            {selectedRole && (
              <p className="role-description">
                {selectedRole.description}
              </p>
            )}

            {rolesError && (
              <div className="configuration-error">
                <p>{rolesError}</p>

                <button
                  className="secondary-button"
                  type="button"
                  onClick={reloadRoles}
                >
                  重新加载岗位
                </button>
              </div>
            )}

            <CustomSelect
              id="interview-type-select"
              label="面试类型"
              value={interviewType}
              options={INTERVIEW_TYPE_OPTIONS}
              disabled={started}
              onChange={(nextInterviewType) => {
                setInterviewType(nextInterviewType);
                setError("");
              }}
            />

            {!started && (
              <button
                className="primary-button"
                type="button"
                disabled={
                  rolesLoading ||
                  questionsLoading ||
                  !role
                }
                onClick={startInterview}
              >
                {questionsLoading
                  ? "正在抽取题目……"
                  : "开始模拟面试"}
              </button>
            )}

            {started && (
              <button
                className="secondary-button"
                type="button"
                onClick={resetInterview}
              >
                重新配置
              </button>
            )}

            {(error || questionsError) && (
              <p className="error-message">
                {error || questionsError}
              </p>
            )}
          </aside>

          <section className="panel interview-panel">
            {!started && (
              <div className="empty-state">
                <span className="empty-state-icon">
                  ✦
                </span>

                <h2>准备开始练习</h2>

                <p>
                  题目来自MySQL题库。当前版本不会调用或冒充真实的AI评分结果。
                </p>
              </div>
            )}

            {started && !completed && currentQuestion && (
              <form onSubmit={submitAnswer}>
                <div className="question-header">
                  <div>
                    <p className="section-number">02</p>

                    <p className="question-meta">
                      {selectedRole?.displayName} ·{" "}
                      {interviewType}
                    </p>
                  </div>

                  <span className="progress">
                    {currentIndex + 1} /{" "}
                    {questions.length}
                  </span>
                </div>

                <div className="question-tags">
                  <span>{currentQuestion.category}</span>
                  <span>{currentQuestion.difficulty}</span>
                </div>

                <h2 className="question">
                  {currentQuestion.questionText}
                </h2>

                <label>
                  我的回答

                  <textarea
                    value={answer}
                    onChange={(event) => {
                      setAnswer(event.target.value);
                      setError("");
                    }}
                    placeholder="在这里整理你的回答思路……"
                    rows="9"
                  />
                </label>

                {error && (
                  <p className="error-message">
                    {error}
                  </p>
                )}

                <button
                  className="primary-button"
                  type="submit"
                  disabled={saving}
                >
                  {saving
                    ? "正在保存……"
                    : currentIndex ===
                        questions.length - 1
                      ? "完成练习"
                      : "保存并进入下一题"}
                </button>
              </form>
            )}

            {completed && (
              <div className="result">
                <p className="section-number">03</p>
                <h2>本次练习已完成</h2>

                <p>
                  已将 {answers.length} 道题的回答保存到当前账号。
                  当前版本尚未接入AI评分。
                </p>

                <div className="answer-list">
                  {answers.map((item, index) => (
                    <article
                      className="answer-item"
                      key={item.questionId}
                    >
                      <span>问题 {index + 1}</span>
                      <h3>{item.question}</h3>
                      <p>{item.answer}</p>
                    </article>
                  ))}
                </div>

                <button
                  className="primary-button"
                  type="button"
                  onClick={resetInterview}
                >
                  再练习一次
                </button>
              </div>
            )}
          </section>
        </section>

        <InterviewHistory
          history={history}
          historyLoading={historyLoading}
          historyError={historyError}
          clearHistory={clearHistory}
        />
      </main>

      <footer className="site-footer">
        <p>
          AI Interview Agent · 个人练习项目
        </p>
        <p>
          已连接MySQL题库，尚未连接AI评分模型。
        </p>
      </footer>
    </div>
  );
}
