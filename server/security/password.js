const {
  randomBytes,
  scrypt: scryptCallback,
  timingSafeEqual,
} = require("node:crypto");
const { promisify } = require("node:util");

const scrypt = promisify(scryptCallback);

const KEY_LENGTH = 64;

const SCRYPT_OPTIONS = {
  cost: 131072,
  blockSize: 8,
  parallelization: 1,
  maxmem: 256 * 1024 * 1024,
};

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");

  const derivedKey = await scrypt(
    password,
    salt,
    KEY_LENGTH,
    SCRYPT_OPTIONS,
  );

  return [
    "scrypt",
    SCRYPT_OPTIONS.cost,
    SCRYPT_OPTIONS.blockSize,
    SCRYPT_OPTIONS.parallelization,
    salt,
    derivedKey.toString("hex"),
  ].join("$");
}

async function verifyPassword(password, storedPassword) {
  try {
    const [
      algorithm,
      cost,
      blockSize,
      parallelization,
      salt,
      storedKey,
    ] = storedPassword.split("$");

    if (algorithm !== "scrypt" || !salt || !storedKey) {
      return false;
    }

    const derivedKey = await scrypt(password, salt, KEY_LENGTH, {
      cost: Number(cost),
      blockSize: Number(blockSize),
      parallelization: Number(parallelization),
      maxmem: 256 * 1024 * 1024,
    });

    const storedKeyBuffer = Buffer.from(storedKey, "hex");

    if (storedKeyBuffer.length !== derivedKey.length) {
      return false;
    }

    return timingSafeEqual(storedKeyBuffer, derivedKey);
  } catch {
    return false;
  }
}

module.exports = {
  hashPassword,
  verifyPassword,
};