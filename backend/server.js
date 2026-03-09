const http = require("http");
const url = require("url");

const handleArtists = require("./handlers/artists");

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);

  // Enable CORS manually
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    return res.end();
  }

  // ROUTING
  if (parsedUrl.pathname === "/artists") {
    return handleArtists(req, res);
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ message: "Route not found" }));
});

server.listen(5000, () => {
  console.log("Server running on port 5000");
});