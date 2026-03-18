const express = require("express");
const cors = require("cors");
const layoutRoutes = require("./routes/layout"); // new for routing > layout.js

const artistRoutes = require("./routes/artists");
const artworkRoutes = require("./routes/artworks");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/layout", layoutRoutes); // new for routing > layout.js

app.use("/artists", artistRoutes);
app.use("/artworks", artworkRoutes);

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
