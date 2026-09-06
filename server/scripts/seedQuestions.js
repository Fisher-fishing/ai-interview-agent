require("dotenv").config();

const database = require("../database");
const {
  interviewRoles,
  questions,
} = require("../seeds/questionBank");

const EXPECTED_ROLE_KEYS = [
  "frontend",
  "backend",
  "ai_agent",
  "ai_engineer",
  "fullstack",
];

function validateQuestionBank() {
  if (interviewRoles.length !== EXPECTED_ROLE_KEYS.length) {
    throw new Error("岗位数量必须为 5。");
  }

  if (questions.length !== 100) {
    throw new Error(
      `题库总数必须为 100，当前为 ${questions.length}。`,
    );
  }

  const sourceKeys = new Set();

  for (const roleKey of EXPECTED_ROLE_KEYS) {
    const roleQuestions = questions.filter(
      (question) => question.roleKey === roleKey,
    );

    if (roleQuestions.length !== 20) {
      throw new Error(
        `${roleKey} 必须为 20 题，当前为 ${roleQuestions.length}。`,
      );
    }
  }

  for (const question of questions) {
    if (sourceKeys.has(question.sourceKey)) {
      throw new Error(
        `题目标识重复：${question.sourceKey}`,
      );
    }

    sourceKeys.add(question.sourceKey);
  }
}

async function upsertRole(connection, role) {
  const [rows] = await connection.execute(
    "SELECT role_key FROM interview_roles WHERE role_key = ?",
    [role.roleKey],
  );

  if (rows.length > 0) {
    await connection.execute(
      `
        UPDATE interview_roles
        SET
          display_name = ?,
          description = ?,
          display_order = ?,
          is_active = TRUE
        WHERE role_key = ?
      `,
      [
        role.displayName,
        role.description,
        role.displayOrder,
        role.roleKey,
      ],
    );

    return;
  }

  await connection.execute(
    `
      INSERT INTO interview_roles (
        role_key,
        display_name,
        description,
        display_order
      )
      VALUES (?, ?, ?, ?)
    `,
    [
      role.roleKey,
      role.displayName,
      role.description,
      role.displayOrder,
    ],
  );
}

async function upsertQuestion(connection, question) {
  const [rows] = await connection.execute(
    "SELECT id FROM questions WHERE source_key = ?",
    [question.sourceKey],
  );

  const values = [
    question.roleKey,
    question.category,
    question.interviewType,
    question.difficulty,
    question.questionText,
    question.sourceName,
    question.sourceUrl,
    question.license,
  ];

  if (rows.length > 0) {
    await connection.execute(
      `
        UPDATE questions
        SET
          role_key = ?,
          category = ?,
          interview_type = ?,
          difficulty = ?,
          question_text = ?,
          source_name = ?,
          source_url = ?,
          license = ?,
          is_active = TRUE
        WHERE source_key = ?
      `,
      [...values, question.sourceKey],
    );

    return;
  }

  await connection.execute(
    `
      INSERT INTO questions (
        source_key,
        role_key,
        category,
        interview_type,
        difficulty,
        question_text,
        source_name,
        source_url,
        license
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [question.sourceKey, ...values],
  );
}

async function seed() {
  validateQuestionBank();

  const connection = await database.getConnection();

  try {
    await connection.beginTransaction();

    for (const role of interviewRoles) {
      await upsertRole(connection, role);
    }

    for (const question of questions) {
      await upsertQuestion(connection, question);
    }

    await connection.commit();

    const [counts] = await connection.execute(`
      SELECT
        role_key AS roleKey,
        COUNT(*) AS questionCount
      FROM questions
      WHERE is_active = TRUE
      GROUP BY role_key
      ORDER BY role_key
    `);

    console.table(
      counts.map((item) => ({
        role: item.roleKey,
        questions: Number(item.questionCount),
      })),
    );

    console.log("题库导入完成，共 100 题。");
  } catch (error) {
    await connection.rollback().catch(() => {});
    throw error;
  } finally {
    connection.release();
  }
}

seed()
  .catch((error) => {
    console.error("题库导入失败：", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await database.end();
  });