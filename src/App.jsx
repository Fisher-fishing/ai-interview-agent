import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAuth } from "./context/AuthContext";
import { useInterviewHistory } from "./hooks/useInterviewHistory";
import { useQuestionBank } from "./hooks/useQuestionBank";

const INTERVIEW_TYPES = [
  "技术面试",
  "项目面试",
  "综合面试",
];

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

            <label>
              目标岗位

              <select
                value={role}
                disabled={started || rolesLoading}
                onChange={(event) => {
                  setRole(event.target.value);
                  setError("");
                }}
              >
                {rolesLoading && (
                  <option value="">正在加载岗位……</option>
                )}

                {!rolesLoading && roles.length === 0 && (
                  <option value="">暂无可用岗位</option>
                )}

                {roles.map((item) => (
                  <option
                    value={item.roleKey}
                    key={item.roleKey}
                  >
                    {item.displayName}（{item.questionCount}题）
                  </option>
                ))}
              </select>
            </label>

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

            <label>
              面试类型

              <select
                value={interviewType}
                disabled={started}
                onChange={(event) => {
                  setInterviewType(event.target.value);
                  setError("");
                }}
              >
                {INTERVIEW_TYPES.map((type) => (
                  <option value={type} key={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

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

        <section className="panel history-panel">
          <div className="history-header">
            <div>
              <p className="section-number">04</p>
              <h2>练习记录</h2>
            </div>

            {history.length > 0 && (
              <button
                className="clear-history-button"
                type="button"
                onClick={clearHistory}
              >
                清空记录
              </button>
            )}
          </div>

          {historyLoading ? (
            <p className="history-status">
              正在加载练习记录……
            </p>
          ) : historyError ? (
            <p className="history-status history-status-error">
              {historyError}
            </p>
          ) : history.length === 0 ? (
            <p className="history-empty">
              完成一次模拟面试后，记录会保存到当前账号。
            </p>
          ) : (
            <div className="history-list">
              {history.map((record) => (
                <article
                  className="history-item"
                  key={record.id}
                >
                  <div>
                    <h3>{record.role}</h3>
                    <p>{record.interviewType}</p>
                  </div>

                  <div className="history-meta">
                    <strong>
                      {record.answerCount} 道题
                    </strong>

                    <time dateTime={record.createdAt}>
                      {new Intl.DateTimeFormat(
                        "zh-CN",
                        {
                          dateStyle: "medium",
                          timeStyle: "short",
                        },
                      ).format(
                        new Date(
                          Number(record.createdAt),
                        ),
                      )}
                    </time>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
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