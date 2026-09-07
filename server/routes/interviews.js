const express = require("express");

const database = require("../database");
const {
  requireAuthentication,
} = require("../security/session");

const router = express.Router();

router.use(requireAuthentication);

function normalizeText(value, maximumLength) {
  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value.trim();

  if (
    !normalizedValue ||
    normalizedValue.length > maximumLength
  ) {
    return null;
  }

  return normalizedValue;
}

async function insertInterview(
  userId,
  role,
  interviewType,
  answers,
) {
  const connection = await database.getConnection();

  try {
    await connection.beginTransaction();

    const createdAt = Date.now();

    const [interviewResult] = await connection.execute(
      `
        INSERT INTO interviews (
          user_id,
          role,
          interview_type,
          created_at
        )
        VALUES (?, ?, ?, ?)
      `,
      [userId, role, interviewType, createdAt],
    );

    const interviewId = interviewResult.insertId;

    for (const [index, item] of answers.entries()) {
      await connection.execute(
        `
          INSERT INTO interview_answers (
            interview_id,
            question_order,
            question,
            answer
          )
          VALUES (?, ?, ?, ?)
        `,
        [
          interviewId,
          index + 1,
          item.question,
          item.answer,
        ],
      );
    }

    await connection.commit();

    return {
      id: Number(interviewId),
      role,
      interviewType,
      createdAt,
      answerCount: answers.length,
    };
  } catch (error) {
    await connection.rollback().catch(() => {});
    throw error;
  } finally {
    connection.release();
  }
}

router.get("/", async (request, response, next) => {
  try {
    const [rows] = await database.execute(
      `
        SELECT
          interviews.id,
          interviews.role,
          interviews.interview_type AS interviewType,
          interviews.created_at AS createdAt,
          COUNT(interview_answers.id) AS answerCount
        FROM interviews
        LEFT JOIN interview_answers
          ON interview_answers.interview_id = interviews.id
        WHERE interviews.user_id = ?
        GROUP BY
          interviews.id,
          interviews.role,
          interviews.interview_type,
          interviews.created_at
        ORDER BY interviews.created_at DESC
        LIMIT 20
      `,
      [request.user.id],
    );

    const interviews = rows.map((row) => ({
      id: Number(row.id),
      role: row.role,
      interviewType: row.interviewType,
      createdAt: Number(row.createdAt),
      answerCount: Number(row.answerCount),
    }));

    return response.json({
      interviews,
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/:id", async (request, response, next) => {
  try {
    const interviewId = Number(request.params.id);

    if (
      !Number.isSafeInteger(interviewId) ||
      interviewId < 1
    ) {
      return response.status(400).json({
        message: "面试记录编号不正确。",
      });
    }

    const [interviewRows] = await database.execute(
      `
        SELECT
          id,
          role,
          interview_type AS interviewType,
          created_at AS createdAt
        FROM interviews
        WHERE id = ? AND user_id = ?
      `,
      [interviewId, request.user.id],
    );

    const interview = interviewRows[0];

    if (!interview) {
      return response.status(404).json({
        message: "没有找到该面试记录。",
      });
    }

    const [answerRows] = await database.execute(
      `
        SELECT
          question_order AS questionOrder,
          question,
          answer
        FROM interview_answers
        WHERE interview_id = ?
        ORDER BY question_order
      `,
      [interviewId],
    );

    return response.json({
      interview: {
        id: Number(interview.id),
        role: interview.role,
        interviewType: interview.interviewType,
        createdAt: Number(interview.createdAt),
        answerCount: answerRows.length,
        answers: answerRows.map((item) => ({
          questionOrder: Number(item.questionOrder),
          question: item.question,
          answer: item.answer,
        })),
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/", async (request, response, next) => {
  try {
    const body = request.body ?? {};

    const role = normalizeText(body.role, 80);
    const interviewType = normalizeText(
      body.interviewType,
      40,
    );

    if (!role || !interviewType) {
      return response.status(400).json({
        message: "岗位或面试类型不正确。",
      });
    }

    if (
      !Array.isArray(body.answers) ||
      body.answers.length < 1 ||
      body.answers.length > 20
    ) {
      return response.status(400).json({
        message: "回答数量必须为 1 至 20 条。",
      });
    }

    const answers = body.answers.map((item) => ({
      question: normalizeText(item?.question, 1000),
      answer: normalizeText(item?.answer, 5000),
    }));

    if (
      answers.some(
        (item) => !item.question || !item.answer,
      )
    ) {
      return response.status(400).json({
        message: "问题或回答内容不正确。",
      });
    }

    const interview = await insertInterview(
      request.user.id,
      role,
      interviewType,
      answers,
    );

    return response.status(201).json({
      interview,
    });
  } catch (error) {
    return next(error);
  }
});

router.delete("/", async (request, response, next) => {
  try {
    await database.execute(
      "DELETE FROM interviews WHERE user_id = ?",
      [request.user.id],
    );

    return response.status(204).end();
  } catch (error) {
    return next(error);
  }
});

module.exports = router;