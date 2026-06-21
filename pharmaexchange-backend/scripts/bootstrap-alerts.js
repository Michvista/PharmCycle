require('dotenv').config();
const { runExpiryCheck } = require('../src/jobs/expiryCheck.job');

runExpiryCheck()
  .then(() => console.log('Alerts bootstrapped. Restart frontend or refresh /alerts page.'))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
