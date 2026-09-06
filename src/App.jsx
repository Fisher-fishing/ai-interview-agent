import { useMemo, useState } from "react";
import { useInterviewHistory } from "./hooks/useInterviewHistory";
import { useAuth } from "./context/AuthContext";

const QUESTION_BANK = {
  frontend: [
    "请介绍 JavaScript 事件循环，以及宏任务和微任务的区别。",
    "React 中 useEffect 的依赖数组有什么作用？",
    "你会如何设计一个可复用的 React 表单组件？",
  ],
  aiApplication: [
    "请介绍大语言模型应用中 Prompt 的基本组成。",
    "什么是 RAG？它适合解决哪些问题？",
    "前端项目调用 AI 接口时，为什么不能直接暴露 API Key？",
  ],
};

const ROLE_NAMES = {
  frontend: "前端开发工程师",
  aiApplication: "AI 应用开发工程师",
};

export default function App() {
  const { user, logout } = useAuth();
  const [role, setRole] = useState("frontend");
  const [interviewType, setInterviewType] = useState("技术面试");
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [answers, setAnswers] = useState([]);
  const [error, setError] = useState("");
  const { history, addHistory, clearHistory } =
  useInterviewHistory();

  const questions = useMemo(() => QUESTION_BANK[role], [role]);
  const currentQuestion = questions[currentIndex];

  function startInterview() {
    setStarted(true);
    setCompleted(false);
    setCurrentIndex(0);
    setAnswer("");
    setAnswers([]);
    setError("");
  }

  function submitAnswer(event) {
    event.preventDefault();

    const normalizedAnswer = answer.trim();

    if (!normalizedAnswer) {
      setError("请先填写你的回答。");
      return;
    }

    const nextAnswers = [
      ...answers,
      {
        question: currentQuestion,
        answer: normalizedAnswer,
      },
    ];

    setAnswers(nextAnswers);
    setError("");

    if (currentIndex === questions.length - 1) {
    addHistory({
        role: ROLE_NAMES[role],
        interviewType,
        answers: nextAnswers,
    });

    setCompleted(true);
    return;
    }
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
  }

  return (
    <div className="app">
      <header className="site-header">
        <div className="brand-group">
            <a className="brand" href="/" aria-label="返回首页">
            Interview Agent
            </a>

            <span className="project-label">个人练习项目</span>
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
          <p className="eyebrow">AI INTERVIEW PRACTICE</p>
          <h1>让每一次模拟面试都有清晰的练习记录</h1>
          <p className="hero-description">
            根据目标岗位完成模拟问答，整理自己的回答思路，为后续接入
            AI 分析与反馈功能做好准备。
          </p>
        </section>

        <section className="workspace">
          <aside className="panel configuration-panel">
            <div>
              <p className="section-number">01</p>
              <h2>面试配置</h2>
              <p className="section-description">
                选择目标岗位和本次练习类型。
              </p>
            </div>

            <label>
              目标岗位
              <select
                value={role}
                disabled={started}
                onChange={(event) => setRole(event.target.value)}
              >
                <option value="frontend">前端开发工程师</option>
                <option value="aiApplication">AI 应用开发工程师</option>
              </select>
            </label>

            <label>
              面试类型
              <select
                value={interviewType}
                disabled={started}
                onChange={(event) => setInterviewType(event.target.value)}
              >
                <option value="技术面试">技术面试</option>
                <option value="项目面试">项目面试</option>
                <option value="综合面试">综合面试</option>
              </select>
            </label>

            {!started && (
              <button className="primary-button" onClick={startInterview}>
                开始模拟面试
              </button>
            )}

            {started && (
              <button className="secondary-button" onClick={resetInterview}>
                重新配置
              </button>
            )}
          </aside>

          <section className="panel interview-panel">
            {!started && (
              <div className="empty-state">
                <span className="empty-state-icon">✦</span>
                <h2>准备开始练习</h2>
                <p>
                  当前版本使用本地示例题，不会调用或冒充真实的 AI
                  分析结果。
                </p>
              </div>
            )}

            {started && !completed && (
              <form onSubmit={submitAnswer}>
                <div className="question-header">
                  <div>
                    <p className="section-number">02</p>
                    <p className="question-meta">
                      {ROLE_NAMES[role]} · {interviewType}
                    </p>
                  </div>

                  <span className="progress">
                    {currentIndex + 1} / {questions.length}
                  </span>
                </div>

                <h2 className="question">{currentQuestion}</h2>

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

                {error && <p className="error-message">{error}</p>}

                <button className="primary-button" type="submit">
                  {currentIndex === questions.length - 1
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
                  已记录 {answers.length} 道题的回答。当前版本仅保存本次页面状态，
                  尚未接入 AI 评分。
                </p>

                <div className="answer-list">
                  {answers.map((item, index) => (
                    <article className="answer-item" key={item.question}>
                      <span>问题 {index + 1}</span>
                      <h3>{item.question}</h3>
                      <p>{item.answer}</p>
                    </article>
                  ))}
                </div>

                <button className="primary-button" onClick={resetInterview}>
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

            {history.length === 0 ? (
                <p className="history-empty">
                完成一次模拟面试后，记录会保存在当前浏览器中。
                </p>
            ) : (
                <div className="history-list">
                {history.map((record) => (
                    <article className="history-item" key={record.id}>
                    <div>
                        <h3>{record.role}</h3>
                        <p>{record.interviewType}</p>
                    </div>

                    <div className="history-meta">
                        <strong>{record.answers.length} 道题</strong>
                        <time dateTime={record.createdAt}>
                        {new Intl.DateTimeFormat("zh-CN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                        }).format(new Date(record.createdAt))}
                        </time>
                    </div>
                    </article>
                ))}
                </div>
            )}
            </section>
      </main>

      <footer className="site-footer">
        <p>AI Interview Agent · 个人练习项目</p>
        <p>当前版本尚未连接 AI 模型或在线服务。</p>
      </footer>
    </div>
  );
}