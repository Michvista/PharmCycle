function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.code === 'P2002') {
    // Prisma unique constraint violation
    return res.status(409).json({ error: 'A record with that value already exists' });
  }

  if (err.code === 'P2025') {
    // Prisma record not found
    return res.status(404).json({ error: 'Record not found' });
  }

  // Neon serverless cold-start / connection drop — return 503 instead of crashing
  if (
    err.name === 'PrismaClientInitializationError' ||
    err.message?.includes("Can't reach database server")
  ) {
    return res.status(503).json({
      error: 'Database temporarily unavailable — please retry in a moment.',
    });
  }

  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
}

module.exports = errorHandler;
