const {
  createHmac,
  randomBytes,
} = require("node:crypto");

const database = require("../database");

const COOKIE_NAME = "interview_session";
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000;

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET 未配置，或者长度不足 32 个字符。",
    );
  }

  return secret;
}

function hashToken(token) {
  return createHmac("sha256", getSessionSecret())
    .update(token)
    .digest("hex");
}

function getCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
}

async function removeExpiredSessions() {
  await database.execute(
    "DELETE FROM sessions WHERE expires_at <= ?",
    [Date.now()],
  );
}

async function createSession(userId) {
  await removeExpiredSessions();

  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const createdAt = Date.now();
  const expiresAt = createdAt + SESSION_DURATION;

  await database.execute(
    `
      INSERT INTO sessions (
        token_hash,
        user_id,
        expires_at,
        created_at
      )
      VALUES (?, ?, ?, ?)
    `,
    [tokenHash, userId, expiresAt, createdAt],
  );

  return token;
}

async function getUserFromSession(token) {
  if (!token) {
    return null;
  }

  const tokenHash = hashToken(token);

  const [rows] = await database.execute(
    `
      SELECT
        users.id,
        users.email,
        users.created_at AS createdAt,
        sessions.expires_at AS expiresAt
      FROM sessions
      INNER JOIN users
        ON users.id = sessions.user_id
      WHERE sessions.token_hash = ?
    `,
    [tokenHash],
  );

  const session = rows[0];

  if (!session) {
    return null;
  }

  if (Number(session.expiresAt) <= Date.now()) {
    await database.execute(
      "DELETE FROM sessions WHERE token_hash = ?",
      [tokenHash],
    );

    return null;
  }

  return {
    id: session.id,
    email: session.email,
    createdAt: session.createdAt,
  };
}

async function deleteSession(token) {
  if (!token) {
    return;
  }

  await database.execute(
    "DELETE FROM sessions WHERE token_hash = ?",
    [hashToken(token)],
  );
}

function setSessionCookie(response, token) {
  response.cookie(COOKIE_NAME, token, {
    ...getCookieOptions(),
    maxAge: SESSION_DURATION,
  });
}

function clearSessionCookie(response) {
  response.clearCookie(
    COOKIE_NAME,
    getCookieOptions(),
  );
}

async function requireAuthentication(
  request,
  response,
  next,
) {
  try {
    const token = request.cookies[COOKIE_NAME];
    const user = await getUserFromSession(token);

    if (!user) {
      return response.status(401).json({
        message: "请先登录。",
      });
    }

    request.user = user;
    request.sessionToken = token;

    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  COOKIE_NAME,
  createSession,
  getUserFromSession,
  deleteSession,
  setSessionCookie,
  clearSessionCookie,
  requireAuthentication,
};