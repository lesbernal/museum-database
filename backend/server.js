const express = require("express");
const cors = require("cors");

const artistRoutes = require("./routes/artists");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/artists", artistRoutes);

app.listen(5000, () => {
  console.log("Server running on port 5000");
});