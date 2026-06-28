const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const { signToken } = require('../utils/jwt');
const { createResetToken, consumeResetToken } = require('../lib/passwordResetStore');

/**
 * POST /consumer/auth/register
 * Body: { name, email, password, city, state, lat, lng }
 */
async function registerConsumer(req, res) {
  const { name, email, password, city, state, lat, lng } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const existing = await prisma.consumer.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const hashedPassword = await bcrypt.hash(password, 10);

  const consumer = await prisma.consumer.create({
    data: { name, email, password: hashedPassword, city, state, lat: lat ?? null, lng: lng ?? null },
  });

  const token = signToken({ consumerId: consumer.id, type: 'consumer' });

  res.status(201).json({
    token,
    consumer: { id: consumer.id, name: consumer.name, email: consumer.email, city: consumer.city, state: consumer.state },
  });
}

/**
 * POST /consumer/auth/login
 * Body: { email, password }
 */
async function loginConsumer(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const consumer = await prisma.consumer.findUnique({ where: { email } });
  if (!consumer) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, consumer.password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = signToken({ consumerId: consumer.id, type: 'consumer' });

  res.json({
    token,
    consumer: { id: consumer.id, name: consumer.name, email: consumer.email, city: consumer.city, state: consumer.state },
  });
}

async function requestPasswordReset(req, res) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const consumer = await prisma.consumer.findUnique({ where: { email } });
  if (!consumer) {
    return res.status(404).json({ error: 'No account found for that email' });
  }

  const resetToken = await createResetToken({ accountType: 'CONSUMER', email: consumer.email });
  res.json({
    message: 'Reset link created',
    resetToken,
    resetUrl: `/reset-password?role=consumer&token=${resetToken}`,
  });
}

async function resetPassword(req, res) {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'Token and password required' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

  const entry = await consumeResetToken(token, 'CONSUMER');
  if (!entry) return res.status(400).json({ error: 'Reset link is invalid or has expired' });

  const hashedPassword = await bcrypt.hash(password, 10);
  await prisma.consumer.update({
    where: { email: entry.email },
    data: { password: hashedPassword },
  });

  res.json({ message: 'Password updated successfully' });
}

module.exports = { registerConsumer, loginConsumer, requestPasswordReset, resetPassword };
