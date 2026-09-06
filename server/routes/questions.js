const express = require("express");

const database = require("../database");
const {
  requireAuthentication,
} = require("../security/session");

const router = express.Router();

const INTERVIEW_TYPES = [
  "技术面试",
  "项目面试",
  "综合面试",
];

const DIFFICULTIES = [
  "初级",
  "中级",
  "高级",
];

router.use(requireAuthentication);

function normalizeOptionalText(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function parseLimit(value) {
  if (value === undefined) {
    return 5;
  }

  const limit = Number(value);

  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 20
  ) {
    return null;
  }

  return limit;
}

router.get("/roles", async (_request, response, next) => {
  try {
    const [rows] = await database.execute(`
      SELECT
        roles.role_key AS roleKey,
        roles.display_name AS displayName,
        roles.description,
        COUNT(questions.id) AS questionCount
      FROM interview_roles AS roles
      LEFT JOIN questions
        ON questions.role_key = roles.role_key
        AND questions.is_active = TRUE
      WHERE roles.is_active = TRUE
      GROUP BY
        roles.role_key,
        roles.display_name,
        roles.description,
        roles.display_order
      ORDER BY roles.display_order
    `);

    return response.json({
      roles: rows.map((role) => ({
        roleKey: role.roleKey,
        displayName: role.displayName,
        description: role.description,
        questionCount: Number(role.questionCount),
      })),
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/", async (request, response, next) => {
  try {
    const roleKey = normalizeOptionalText(
      request.query.role,
    );

    const interviewType = normalizeOptionalText(
      request.query.interviewType,
    );

    const difficulty = normalizeOptionalText(
      request.query.difficulty,
    );

    const limit = parseLimit(request.query.limit);

    if (!roleKey || roleKey.length > 32) {
      return response.status(400).json({
        message: "请选择有效的目标岗位。",
      });
    }

    if (
      interviewType &&
      !INTERVIEW_TYPES.includes(interviewType)
    ) {
      return response.status(400).json({
        message: "面试类型不正确。",
      });
    }

    if (
      difficulty &&
      !DIFFICULTIES.includes(difficulty)
    ) {
      return response.status(400).json({
        message: "题目难度不正确。",
      });
    }

    if (limit === null) {
      return response.status(400).json({
        message: "抽题数量必须为 1 至 20。",
      });
    }

    const [roleRows] = await database.execute(
      `
        SELECT
          role_key AS roleKey,
          display_name AS displayName
        FROM interview_roles
        WHERE role_key = ? AND is_active = TRUE
      `,
      [roleKey],
    );

    const role = roleRows[0];

    if (!role) {
      return response.status(404).json({
        message: "没有找到该岗位。",
      });
    }

    const conditions = [
      "questions.role_key = ?",
      "questions.is_active = TRUE",
    ];

    const parameters = [roleKey];

    if (interviewType) {
      conditions.push(
        "questions.interview_type = ?",
      );
      parameters.push(interviewType);
    }

    if (difficulty) {
      conditions.push("questions.difficulty = ?");
      parameters.push(difficulty);
    }

    parameters.push(limit);

    const [questionRows] = await database.execute(
      `
        SELECT
          id,
          role_key AS roleKey,
          category,
          interview_type AS interviewType,
          difficulty,
          question_text AS questionText
        FROM questions
        WHERE ${conditions.join(" AND ")}
        ORDER BY RAND()
        LIMIT ?
      `,
      parameters,
    );

    return response.json({
      role: {
        roleKey: role.roleKey,
        displayName: role.displayName,
      },
      filters: {
        interviewType: interviewType || null,
        difficulty: difficulty || null,
        requestedLimit: limit,
      },
      count: questionRows.length,
      questions: questionRows.map((question) => ({
        id: Number(question.id),
        roleKey: question.roleKey,
        category: question.category,
        interviewType: question.interviewType,
        difficulty: question.difficulty,
        questionText: question.questionText,
      })),
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;