const app = require('./app');
const connectDb = require('./config/database');

connectDb();
app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`.bgMagenta);
});