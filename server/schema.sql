CREATE DATABASE IF NOT EXISTS ai_interview_agent
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE ai_interview_agent;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(254) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (id),
  UNIQUE KEY users_email_unique (email)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS sessions (
  token_hash CHAR(64)
    CHARACTER SET ascii
    COLLATE ascii_bin
    NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  expires_at BIGINT UNSIGNED NOT NULL,
  created_at BIGINT UNSIGNED NOT NULL,

  PRIMARY KEY (token_hash),
  KEY sessions_user_id_index (user_id),
  KEY sessions_expires_at_index (expires_at),

  CONSTRAINT sessions_user_foreign
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS interviews (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  role VARCHAR(80) NOT NULL,
  interview_type VARCHAR(40) NOT NULL,
  created_at BIGINT UNSIGNED NOT NULL,

  PRIMARY KEY (id),
  KEY interviews_user_created_index (user_id, created_at),

  CONSTRAINT interviews_user_foreign
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS interview_answers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  interview_id BIGINT UNSIGNED NOT NULL,
  question_order INT UNSIGNED NOT NULL,
  question VARCHAR(1000) NOT NULL,
  answer TEXT NOT NULL,

  PRIMARY KEY (id),
  KEY interview_answers_interview_index (
    interview_id,
    question_order
  ),

  CONSTRAINT interview_answers_interview_foreign
    FOREIGN KEY (interview_id)
    REFERENCES interviews(id)
    ON DELETE CASCADE
) ENGINE = InnoDB;