const http = require("http");
const url = require("url");
const handleArtists = require("./handlers/artists"); // handles artists + artwork + provenance
const handleLogin = require("./handlers/auth");

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.end();

  const parsedUrl = url.parse(req.url, true);

  // ------------------ ROUTING ------------------

  if (parsedUrl.pathname === "/login") {
    return handleLogin(req, res);
  }

  // Artists, Artwork, Provenance all go to same handler
  if (
    parsedUrl.pathname.startsWith("/artists") ||
    parsedUrl.pathname.startsWith("/artwork") ||
    parsedUrl.pathname.startsWith("/provenance")
  ) {
    return handleArtists(req, res, parsedUrl);
  }

  // 404 for all other routes
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ message: "Route not found" }));
});

server.listen(5000, () =>
  console.log("Server running on http://localhost:5000")
);
