const express = require("express");
const { rateLimit } = require("express-rate-limit");

const database = require("../database");
const {
  hashPassword,
  verifyPassword,
} = require("../security/password");
const {
  COOKIE_NAME,
  createSession,
  deleteSession,
  setSessionCookie,
  clearSessionCookie,
  requireAuthentication,
} = require("../security/session");

const router = express.Router();

const authenticationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message: "请求次数过多，请稍后再试。",
  },
});

function normalizeEmail(value) {
  return typeof value === "string"
    ? value.trim().toLowerCase()
    : "";
}

function isValidEmail(email) {
  return (
    email.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  );
}

function isValidPassword(password) {
  return (
    typeof password === "string" &&
    password.length >= 8 &&
    password.length <= 128
  );
}

router.post(
  "/register",
  authenticationLimiter,
  async (request, response, next) => {
    let connection;

    try {
      const body = request.body ?? {};
      const email = normalizeEmail(body.email);
      const password = body.password;

      if (!isValidEmail(email)) {
        return response.status(400).json({
          message: "请输入有效的邮箱地址。",
        });
      }

      if (!isValidPassword(password)) {
        return response.status(400).json({
          message: "密码长度必须为 8 至 128 个字符。",
        });
      }

      connection = await database.getConnection();
      await connection.beginTransaction();

      const [existingRows] = await connection.execute(
        "SELECT id FROM users WHERE email = ?",
        [email],
      );

      if (existingRows.length > 0) {
        await connection.rollback();

        return response.status(409).json({
          message: "该邮箱已经注册。",
        });
      }

      const passwordHash = await hashPassword(password);

      const [insertResult] = await connection.execute(
        `
          INSERT INTO users (
            email,
            password_hash
          )
          VALUES (?, ?)
        `,
        [email, passwordHash],
      );

      const [userRows] = await connection.execute(
        `
          SELECT
            id,
            email,
            created_at AS createdAt
          FROM users
          WHERE id = ?
        `,
        [insertResult.insertId],
      );

      await connection.commit();

      const user = userRows[0];
      const token = await createSession(user.id);

      setSessionCookie(response, token);

      return response.status(201).json({
        user,
      });
    } catch (error) {
      if (connection) {
        await connection.rollback().catch(() => {});
      }

      if (error.code === "ER_DUP_ENTRY") {
        return response.status(409).json({
          message: "该邮箱已经注册。",
        });
      }

      return next(error);
    } finally {
      connection?.release();
    }
  },
);

router.post(
  "/login",
  authenticationLimiter,
  async (request, response, next) => {
    try {
      const body = request.body ?? {};
      const email = normalizeEmail(body.email);
      const password = body.password;

      if (!email || typeof password !== "string") {
        return response.status(400).json({
          message: "请输入邮箱和密码。",
        });
      }

      const [rows] = await database.execute(
        `
          SELECT
            id,
            email,
            password_hash AS passwordHash,
            created_at AS createdAt
          FROM users
          WHERE email = ?
        `,
        [email],
      );

      const userWithPassword = rows[0];

      const passwordMatches =
        userWithPassword &&
        (await verifyPassword(
          password,
          userWithPassword.passwordHash,
        ));

      if (!passwordMatches) {
        return response.status(401).json({
          message: "邮箱或密码错误。",
        });
      }

      const token = await createSession(
        userWithPassword.id,
      );

      setSessionCookie(response, token);

      return response.json({
        user: {
          id: userWithPassword.id,
          email: userWithPassword.email,
          createdAt: userWithPassword.createdAt,
        },
      });
    } catch (error) {
      return next(error);
    }
  },
);

router.get(
  "/me",
  requireAuthentication,
  (request, response) => {
    response.json({
      user: request.user,
    });
  },
);

router.post(
  "/logout",
  async (request, response, next) => {
    try {
      await deleteSession(
        request.cookies[COOKIE_NAME],
      );

      clearSessionCookie(response);

      return response.status(204).end();
    } catch (error) {
      return next(error);
    }
  },
);

module.exports = router;