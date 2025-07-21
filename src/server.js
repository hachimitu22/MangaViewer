const app = require('./app');
const { sequelize } = require('./models');
const port = 3000;

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ DB connected');

    await sequelize.sync({ force: true });
    console.log('✅ DB created');

    app.listen(port, () => {
      console.log(`port http://localhost:${port} start`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
  }
})();

