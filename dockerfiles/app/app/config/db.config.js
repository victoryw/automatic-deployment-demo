module.exports = {
  HOST: process.env.DBHost || "localhost",
  PORT: process.env.DBPort ||13306,
  USER: process.env.DBUser || "demo",
  PASSWORD: process.env.DBPassword || "demo",
  DB: process.env.DB || "demo"
};
