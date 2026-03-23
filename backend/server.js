const http = require("http");
const url = require("url");
const handleArtists = require("./handlers/artists"); // handles artists + artwork + provenance

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.end();

  const parsedUrl = url.parse(req.url, true);

  // ------------------ ROUTING ------------------
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
/* const http = require("http");
const url = require("url");

// Handlers from both files
const handleArtists = require("./handlers/artists");
const handleTickets = require("./handlers/tickets");
const handleEvents = require("./handlers/events");
const handleDonations = require("./handlers/donations");
const handleUsers = require("./handlers/users");
const handleDepartments = require("./handlers/departments");
const handleGiftshop = require("./handlers/giftshop");
const handleCafe = require("./handlers/cafe");
const handleExhibitions = require("./handlers/exhibitions");

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
  if (parsedUrl.pathname.startsWith("/artists")) {
    return handleArtists(req, res);
  }

  if (parsedUrl.pathname.startsWith("/tickets")) {
    return handleTickets(req, res);
  }

  if (parsedUrl.pathname.startsWith("/events")) {
    return handleEvents(req, res);
  }

  if (parsedUrl.pathname.startsWith("/donations")) {
    return handleDonations(req, res);
  }

  if (parsedUrl.pathname.startsWith("/users")) {
    return handleUsers(req, res);
  }

  if (parsedUrl.pathname.startsWith("/departments")) {
    return handleDepartments(req, res);
  }

  if (parsedUrl.pathname.startsWith("/giftshop")) {
    return handleGiftshop(req, res);
  }

  if (parsedUrl.pathname.startsWith("/cafe")) {
    return handleCafe(req, res);
  }

  if (parsedUrl.pathname.startsWith("/exhibitions")) {
    return handleExhibitions(req, res);
  }

  // 404 for unmatched routes
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ message: "Route not found" }));
});

server.listen(5000, () => {
  console.log("Server running on port 5000");
});
*/