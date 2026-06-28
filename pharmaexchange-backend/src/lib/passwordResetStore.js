const crypto = require('crypto');
const prisma = require('./prisma');

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function createResetToken({ accountType, email }) {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 1000 * 60 * 20);
  await prisma.$executeRaw`
    INSERT INTO "PasswordResetToken" ("id", "accountType", "email", "tokenHash", "expiresAt")
    VALUES (${crypto.randomUUID()}, ${accountType}, ${email}, ${hashToken(rawToken)}, ${expiresAt})
  `;
  return rawToken;
}

async function consumeResetToken(token, accountType) {
  const tokenHash = hashToken(token);
  const rows = await prisma.$queryRaw`
    SELECT "id", "accountType", "email", "tokenHash", "expiresAt", "usedAt"
    FROM "PasswordResetToken"
    WHERE "tokenHash" = ${tokenHash}
    LIMIT 1
  `;
  const entry = rows[0] || null;

  if (!entry) return null;
  if (entry.accountType !== accountType) return null;
  if (entry.usedAt || new Date(entry.expiresAt).getTime() < Date.now()) return null;

  await prisma.$executeRaw`
    UPDATE "PasswordResetToken"
    SET "usedAt" = NOW()
    WHERE "tokenHash" = ${tokenHash}
  `;

  return entry;
}

module.exports = {
  createResetToken,
  consumeResetToken,
};
