const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const { signToken } = require('../utils/jwt');
const { createResetToken, consumeResetToken } = require('../lib/passwordResetStore');

/**
 * POST /auth/register
 * Registers a new pharmacy AND its first user (admin) in one step.
 * Body: { pharmacyName, address, city, state, lat, lng, name, email, password }
 */
async function register(req, res) {
  const { pharmacyName, address, city, state, lat, lng, name, email, password } = req.body;

  if (!pharmacyName || !city || !state || !name || !email || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const hashedPassword = await bcrypt.hash(password, 10);

  // Create pharmacy + first admin user together
  const pharmacy = await prisma.pharmacy.create({
    data: {
      name: pharmacyName,
      address: address || '',
      city,
      state,
      lat: lat ?? null,
      lng: lng ?? null,
      verified: true, // auto-verify for hackathon demo - skip KYC flow
      users: {
        create: {
          name,
          email,
          password: hashedPassword,
          role: 'ADMIN',
        },
      },
    },
    include: { users: true },
  });

  const user = pharmacy.users[0];
  const token = signToken({ userId: user.id, pharmacyId: pharmacy.id, role: user.role, type: 'user' });

  res.status(201).json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    pharmacy: { id: pharmacy.id, name: pharmacy.name, city: pharmacy.city, state: pharmacy.state },
  });
}

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const user = await prisma.user.findUnique({
    where: { email },
    include: { pharmacy: true },
  });

  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = signToken({ userId: user.id, pharmacyId: user.pharmacyId, role: user.role, type: 'user' });

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    pharmacy: {
      id: user.pharmacy.id,
      name: user.pharmacy.name,
      city: user.pharmacy.city,
      state: user.pharmacy.state,
    },
  });
}

async function getMe(req, res) {
  const { userId, pharmacyId } = req.user;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { pharmacy: true },
  });

  if (!user) return res.status(404).json({ error: 'User not found' });

  res.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    pharmacy: {
      id: user.pharmacy.id,
      name: user.pharmacy.name,
      city: user.pharmacy.city,
      state: user.pharmacy.state,
      address: user.pharmacy.address,
      verified: user.pharmacy.verified,
    },
  });
}

async function requestPasswordReset(req, res) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const user = await prisma.user.findUnique({ where: { email }, include: { pharmacy: true } });
  if (!user) {
    return res.status(404).json({ error: 'No account found for that email' });
  }

  const resetToken = await createResetToken({ accountType: 'PHARMACY', email: user.email });
  res.json({
    message: 'Reset link created',
    resetToken,
    resetUrl: `/reset-password?role=pharmacy&token=${resetToken}`,
  });
}

async function resetPassword(req, res) {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'Token and password required' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

  const entry = await consumeResetToken(token, 'PHARMACY');
  if (!entry) return res.status(400).json({ error: 'Reset link is invalid or has expired' });

  const hashedPassword = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { email: entry.email },
    data: { password: hashedPassword },
  });

  res.json({ message: 'Password updated successfully' });
}

module.exports = { register, login, getMe, requestPasswordReset, resetPassword };
