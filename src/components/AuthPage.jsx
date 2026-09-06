import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function AuthPage() {
  const { login, register } = useAuth();

  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmedPassword, setConfirmedPassword] =
    useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isRegistering = mode === "register";

  function changeMode(nextMode) {
    setMode(nextMode);
    setPassword("");
    setConfirmedPassword("");
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (
      isRegistering &&
      password !== confirmedPassword
    ) {
      setError("两次输入的密码不一致。");
      return;
    }

    setSubmitting(true);

    try {
      if (isRegistering) {
        await register(email, password);
      } else {
        await login(email, password);
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-shell">
        <div className="auth-intro">
          <p className="eyebrow">PERSONAL PRACTICE PROJECT</p>
          <h1>AI Interview Agent</h1>
          <p>
            通过结构化模拟问题练习表达、整理回答，
            并保存属于自己的面试记录。
          </p>

          <ul>
            <li>前端与 AI 应用岗位题库</li>
            <li>安全的服务端登录会话</li>
            <li>个人面试练习记录</li>
          </ul>
        </div>

        <div className="auth-card">
          <div className="auth-tabs">
            <button
              type="button"
              className={
                mode === "login" ? "active" : ""
              }
              onClick={() => changeMode("login")}
            >
              登录
            </button>

            <button
              type="button"
              className={
                mode === "register" ? "active" : ""
              }
              onClick={() => changeMode("register")}
            >
              注册
            </button>
          </div>

          <h2>{isRegistering ? "创建账号" : "欢迎回来"}</h2>

          <p className="auth-description">
            {isRegistering
              ? "注册后即可开始你的模拟面试。"
              : "登录后继续你的面试练习。"}
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              邮箱
              <input
                type="email"
                value={email}
                autoComplete="email"
                placeholder="name@example.com"
                required
                onChange={(event) =>
                  setEmail(event.target.value)
                }
              />
            </label>

            <label>
              密码
              <input
                type="password"
                value={password}
                minLength="8"
                maxLength="128"
                autoComplete={
                  isRegistering
                    ? "new-password"
                    : "current-password"
                }
                placeholder="至少 8 个字符"
                required
                onChange={(event) =>
                  setPassword(event.target.value)
                }
              />
            </label>

            {isRegistering && (
              <label>
                确认密码
                <input
                  type="password"
                  value={confirmedPassword}
                  minLength="8"
                  maxLength="128"
                  autoComplete="new-password"
                  placeholder="再次输入密码"
                  required
                  onChange={(event) =>
                    setConfirmedPassword(event.target.value)
                  }
                />
              </label>
            )}

            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}

            <button
              className="primary-button"
              type="submit"
              disabled={submitting}
            >
              {submitting
                ? "正在处理……"
                : isRegistering
                  ? "注册并登录"
                  : "登录"}
            </button>
          </form>

          <p className="auth-security-note">
            密码仅以哈希形式保存在本地数据库中。
          </p>
        </div>
      </section>
    </main>
  );
}