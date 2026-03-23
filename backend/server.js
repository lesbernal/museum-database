const http = require("http");
const url = require("url");

// Handlers
const handleCafeitem = require("./handlers/cafeitems");
const handleCafetransaction = require("./handlers/cafetransactions");
const handleCafetransactionitem = require("./handlers/cafetransactionitems");
const handleGiftshopitem = require("./handlers/giftshopitems");
const handleGiftshoptransaction = require("./handlers/giftshoptransactions");
const handleGiftshoptransactionitem = require("./handlers/giftshoptransactionitems");
const handleTickets = require("./handlers/tickets");
const handleEvents = require("./handlers/events");
const handleDonations = require("./handlers/donations");
const handleUsers = require("./handlers/users");
const handleDepartments = require("./handlers/departments");
const handleGiftshop = require("./handlers/giftshop");
const handleCafe = require("./handlers/cafe");
const handleExhibitions = require("./handlers/exhibitions");

const handleArtists = require("./handlers/artists"); // handles artists + artwork + provenance
const handleLogin = require("./handlers/auth");

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    return res.end();
  }

  const parsedUrl = url.parse(req.url, true);
  
  
  // ------------------ ROUTING ------------------
  
  //login/auth
  if (parsedUrl.pathname === "/login") {
    return handleLogin(req, res);
  }

  // Artists, Artwork, Provenance 
  if (
    parsedUrl.pathname.startsWith("/artists") ||
    parsedUrl.pathname.startsWith("/artwork") ||
    parsedUrl.pathname.startsWith("/provenance")
  ) {
    return handleArtists(req, res, parsedUrl);
  }

  if (parsedUrl.pathname === "/cafeitems") {
    return handleCafeitem(req, res);
  }

  if (parsedUrl.pathname === "/cafetransactions") {
    return handleCafetransaction(req, res);
  }

  if (parsedUrl.pathname === "/cafetransactionitems") {
    return handleCafetransactionitem(req, res);
  }

  if (parsedUrl.pathname === "/giftshopitems") {
    return handleGiftshopitem(req, res);
  }

  if (parsedUrl.pathname === "/giftshoptransactions") {
    return handleGiftshoptransaction(req, res);
  }

  if (parsedUrl.pathname === "/giftshoptransactionitems") {
    return handleGiftshoptransactionitem(req, res);
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

  // 404 fallback
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ message: "Route not found" }));
});

server.listen(5000, () => {
  console.log("Server running on port 5000");
});
