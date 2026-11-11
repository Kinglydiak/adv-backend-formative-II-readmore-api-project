require('dotenv').config();

const app = require('./app');
const connectDatabase = require('./config/database');

const port = Number(process.env.PORT) || 3000;

async function startServer() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI must be set in the environment');
  }

  await connectDatabase(process.env.MONGODB_URI);
  app.listen(port, () => {
    console.log(`ReadMore API listening on port ${port}`);
  });
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error('Unable to start ReadMore API:', error.message);
    process.exitCode = 1;
  });
}

module.exports = { startServer };
