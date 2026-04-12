//adding comment to pull
const http = require("http");
const url = require("url");

// Handlers
const handleArtists = require("./handlers/artists");
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
const handleEmployees = require("./handlers/employees");
const handleVisitors = require("./handlers/visitors");
const handleMembers = require("./handlers/members");
const handleDepartments = require("./handlers/departments");
const handleGiftshop = require("./handlers/giftshop");
const handleCafe = require("./handlers/cafe");
const handleExhibitions = require("./handlers/exhibitions");
const handleExhibitionArtwork = require("./handlers/exhibitionartwork");
const handleGalleries = require("./handlers/galleries");
const handleBuildings = require("./handlers/buildings");
const handleLogin = require("./handlers/auth");
const handleReports = require("./handlers/reports");
const handleMembershipTransactions = require("./handlers/membershiptransactions");

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    return res.end();
  }

  const parsedUrl = url.parse(req.url, true);
  console.log(`${req.method} ${parsedUrl.pathname}`);

  // Auth
  if (parsedUrl.pathname === "/login") {
    return handleLogin(req, res);
  }

  // Artists / Artwork / Provenance
  if (
    parsedUrl.pathname.startsWith("/artists") ||
    parsedUrl.pathname.startsWith("/artwork") ||
    parsedUrl.pathname.startsWith("/provenance")
  ) {
    return handleArtists(req, res, parsedUrl);
  }

  // Cafe
  if (parsedUrl.pathname.startsWith("/cafeitems")) {
    return handleCafeitem(req, res, parsedUrl);
  }
  if (parsedUrl.pathname.startsWith("/cafetransactions")) {
    return handleCafetransaction(req, res, parsedUrl);
  }
  if (parsedUrl.pathname.startsWith("/cafetransactionitems")) {
    return handleCafetransactionitem(req, res, parsedUrl);
  }
  if (parsedUrl.pathname.startsWith("/cafe")) {
    return handleCafe(req, res, parsedUrl);
  }

  // Gift Shop
  if (parsedUrl.pathname.startsWith("/giftshopitems")) {
    return handleGiftshopitem(req, res, parsedUrl);
  }
  if (parsedUrl.pathname.startsWith("/giftshoptransactions")) {
    return handleGiftshoptransaction(req, res, parsedUrl);
  }
  if (parsedUrl.pathname.startsWith("/giftshoptransactionitems")) {
    return handleGiftshoptransactionitem(req, res, parsedUrl);
  }
  if (parsedUrl.pathname.startsWith("/giftshop")) {
    return handleGiftshop(req, res, parsedUrl);
  }

  // Membership Transactions — must be BEFORE /members
  if (parsedUrl.pathname.startsWith("/membershiptransactions")) {
    return handleMembershipTransactions(req, res, parsedUrl);
  }

  // Tickets, Events, Donations
  if (parsedUrl.pathname.startsWith("/tickets")) {
    return handleTickets(req, res, parsedUrl);
  }
  if (parsedUrl.pathname.startsWith("/events")) {
    return handleEvents(req, res, parsedUrl);
  }
  if (parsedUrl.pathname.startsWith("/donations")) {
    return handleDonations(req, res, parsedUrl);
  }

  // Users, Employees, Visitors, Members, Departments
  if (parsedUrl.pathname.startsWith("/users")) {
    return handleUsers(req, res, parsedUrl);
  }
  if (parsedUrl.pathname.startsWith("/employees")) {
    return handleEmployees(req, res, parsedUrl);
  }
  if (parsedUrl.pathname.startsWith("/visitors")) {
    return handleVisitors(req, res, parsedUrl);
  }
  if (parsedUrl.pathname.startsWith("/members")) {
    return handleMembers(req, res, parsedUrl);
  }
  if (parsedUrl.pathname.startsWith("/departments")) {
    return handleDepartments(req, res, parsedUrl);
  }

  // Exhibitions, Galleries, Buildings
  if (
    parsedUrl.pathname.startsWith("/exhibitions") ||
    parsedUrl.pathname.startsWith("/exhibitionartwork")
  ) {
    return handleExhibitions(req, res, parsedUrl);
  }
  if (parsedUrl.pathname.startsWith("/galleries")) {
    return handleGalleries(req, res, parsedUrl);
  }
  if (parsedUrl.pathname.startsWith("/buildings")) {
    return handleBuildings(req, res, parsedUrl);
  }

  // Reports & Queries
  if (
    parsedUrl.pathname.startsWith("/reports") ||
    parsedUrl.pathname.startsWith("/queries")
  ) {
    return handleReports(req, res, parsedUrl);
  }

  // 404 for anything else
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ message: "Route not found" }));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});