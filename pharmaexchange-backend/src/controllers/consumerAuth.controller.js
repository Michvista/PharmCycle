const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const { signToken } = require('../utils/jwt');

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

module.exports = { registerConsumer, loginConsumer };
