require("dotenv").config();
console.log("DATABASE_URL:", process.env.DATABASE_URL ? "SET" : "NOT SET");
const app = require("./src/app");
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
