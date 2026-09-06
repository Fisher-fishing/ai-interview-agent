require("dotenv").config();

const express = require("express");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");

require("./database");

const authenticationRoutes = require("./routes/auth");

const app = express();
const port = Number(process.env.PORT) || 3001;

if (
  !process.env.SESSION_SECRET ||
  process.env.SESSION_SECRET.length < 32
) {
  console.error(
    "启动失败：请在 .env 中配置长度至少为 32 个字符的 SESSION_SECRET。",
  );

  process.exit(1);
}

app.disable("x-powered-by");

app.use(helmet());
app.use(express.json({ limit: "32kb" }));
app.use(cookieParser());

app.get("/api/health", (_request, response) => {
  response.json({
    status: "ok",
    project: "AI Interview Agent",
  });
});

app.use("/api/auth", authenticationRoutes);

app.use("/api", (_request, response) => {
  response.status(404).json({
    message: "接口不存在。",
  });
});

app.use((error, _request, response, _next) => {
  console.error(error);

  response.status(500).json({
    message: "服务器内部错误。",
  });
});

app.listen(port, () => {
  console.log(
    `AI Interview Agent API running at http://localhost:${port}`,
  );
});