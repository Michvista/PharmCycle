require('dotenv').config();
require('express-async-errors'); // lets async controller errors flow to errorHandler without try/catch everywhere

const express = require('express');
const cors = require('cors');

const errorHandler = require('./middleware/errorHandler');
const { startExpiryCheckJob } = require('./jobs/expiryCheck.job');

const authRoutes = require('./routes/auth.routes');
const consumerRoutes = require('./routes/consumer.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const inventoryRoutes = require('./routes/inventory.routes');
const transfersRoutes = require('./routes/transfers.routes');
const transferRequestsRoutes = require('./routes/transferRequests.routes');
const insightsRoutes = require('./routes/insights.routes');
const alertsRoutes = require('./routes/alerts.routes');
const pharmaciesRoutes = require('./routes/pharmacies.routes');
const medicinesRoutes = require('./routes/medicines.routes');
const pharmacyRoutes = require('./routes/pharmacy.routes');
const analyticsRoutes = require('./routes/analytics.routes');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Pharmacy-side
app.use('/auth', authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/inventory', inventoryRoutes);
app.use('/transfers', transfersRoutes);
app.use('/transfer-requests', transferRequestsRoutes);
app.use('/insights', insightsRoutes);
app.use('/alerts', alertsRoutes);
app.use('/pharmacies', pharmaciesRoutes);
app.use('/medicines', medicinesRoutes);
app.use('/pharmacy', pharmacyRoutes);
app.use('/analytics', analyticsRoutes);

// Consumer-side
app.use('/consumer', consumerRoutes);

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`PharmaExchange API running on port ${PORT}`);
  startExpiryCheckJob();
});
