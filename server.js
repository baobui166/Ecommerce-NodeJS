require("dotenv").config();
const app = require("./src/app");
const PORT = 5500;

const server = app.listen(PORT, () => {
  console.log("xin chao");
});

process.on("SIGINT", () => {
  server.close(() => console.log("Exit Server Express"));
});
