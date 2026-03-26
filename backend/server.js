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
const handleReports = require("./handlers/reports");

// Load exhibitions handler with error handling
let handleExhibitions;
try {
  handleExhibitions = require("./handlers/exhibitions");
  console.log("✅ exhibitions.js loaded successfully, type:", typeof handleExhibitions);
} catch (err) {
  console.error("❌ Failed to load exhibitions.js:", err.message);
  handleExhibitions = null;
}

const handleLogin = require("./handlers/auth");

console.log("✅ handleExhibitions type:", typeof handleExhibitions);
console.log("✅ handleArtists type:", typeof handleArtists);
console.log("✅ handleLogin type:", typeof handleLogin);
console.log("✅ handleReports type:", typeof handleReports);

// Helper function to set CORS headers
function setCorsHeaders(res) {
  if (!res.headersSent) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Max-Age", "86400");
  }
}

const server = http.createServer((req, res) => {
  // Set CORS headers for every request
  setCorsHeaders(res);

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.writeHead(200);
    return res.end();
  }

  const parsedUrl = url.parse(req.url, true);
  console.log(`${req.method} ${parsedUrl.pathname}`);

  // TEST ENDPOINT
  if (parsedUrl.pathname === "/test-cors") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "CORS is working!", timestamp: Date.now() }));
    return;
  }

  // TEST REPORTS ENDPOINT
  if (parsedUrl.pathname === "/test-reports") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Test reports endpoint working!" }));
    return;
  }

  // Login route
  if (parsedUrl.pathname === "/login") {
    if (typeof handleLogin === 'function') {
      return handleLogin(req, res);
    } else {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Login handler not configured properly" }));
      return;
    }
  }

  // Artists, Artwork, Provenance
  if (
    parsedUrl.pathname.startsWith("/artists") ||
    parsedUrl.pathname.startsWith("/artwork") ||
    parsedUrl.pathname.startsWith("/provenance")
  ) {
    if (typeof handleArtists === 'function') {
      return handleArtists(req, res, parsedUrl);
    } else {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Artists handler not configured properly" }));
      return;
    }
  }

  // Cafe items
  if (parsedUrl.pathname.startsWith("/cafeitems")) {
    if (typeof handleCafeitem === 'function') {
      return handleCafeitem(req, res, parsedUrl);
    } else {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Cafe items handler not configured properly" }));
      return;
    }
  }

  // Cafe transactions
  if (parsedUrl.pathname.startsWith("/cafetransactions")) {
    if (typeof handleCafetransaction === 'function') {
      return handleCafetransaction(req, res, parsedUrl);
    } else {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Cafe transactions handler not configured properly" }));
      return;
    }
  }

  // Cafe transaction items
  if (parsedUrl.pathname.startsWith("/cafetransactionitems")) {
    if (typeof handleCafetransactionitem === 'function') {
      return handleCafetransactionitem(req, res, parsedUrl);
    } else {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Cafe transaction items handler not configured properly" }));
      return;
    }
  }

  // Gift shop items
  if (parsedUrl.pathname.startsWith("/giftshopitems")) {
    if (typeof handleGiftshopitem === 'function') {
      return handleGiftshopitem(req, res, parsedUrl);
    } else {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Gift shop items handler not configured properly" }));
      return;
    }
  }

  // Gift shop transactions
  if (parsedUrl.pathname.startsWith("/giftshoptransactions")) {
    if (typeof handleGiftshoptransaction === 'function') {
      return handleGiftshoptransaction(req, res, parsedUrl);
    } else {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Gift shop transactions handler not configured properly" }));
      return;
    }
  }

  // Gift shop transaction items
  if (parsedUrl.pathname.startsWith("/giftshoptransactionitems")) {
    if (typeof handleGiftshoptransactionitem === 'function') {
      return handleGiftshoptransactionitem(req, res, parsedUrl);
    } else {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Gift shop transaction items handler not configured properly" }));
      return;
    }
  }

  // Tickets
  if (parsedUrl.pathname.startsWith("/tickets") && typeof handleTickets === 'function') {
    return handleTickets(req, res, parsedUrl);
  }

  // Events
  if (parsedUrl.pathname.startsWith("/events") && typeof handleEvents === 'function') {
    return handleEvents(req, res, parsedUrl);
  }

  // Donations
  if (parsedUrl.pathname.startsWith("/donations") && typeof handleDonations === 'function') {
    return handleDonations(req, res, parsedUrl);
  }

  // Users
  if (parsedUrl.pathname.startsWith("/users") && typeof handleUsers === 'function') {
    return handleUsers(req, res, parsedUrl);
  }

  // Employees
  if (parsedUrl.pathname.startsWith("/employees") && typeof handleEmployees === 'function') {
    return handleEmployees(req, res, parsedUrl);
  }

  // Visitors
  if (parsedUrl.pathname.startsWith("/visitors") && typeof handleVisitors === 'function') {
    return handleVisitors(req, res, parsedUrl);
  }

  // Members
  if (parsedUrl.pathname.startsWith("/members") && typeof handleMembers === 'function') {
    return handleMembers(req, res, parsedUrl);
  }

  // Departments
  if (parsedUrl.pathname.startsWith("/departments") && typeof handleDepartments === 'function') {
    return handleDepartments(req, res, parsedUrl);
  }

  // Gift shop
  if (parsedUrl.pathname.startsWith("/giftshop") && typeof handleGiftshop === 'function') {
    return handleGiftshop(req, res, parsedUrl);
  }

  // Cafe
  if (parsedUrl.pathname.startsWith("/cafe") && typeof handleCafe === 'function') {
    return handleCafe(req, res, parsedUrl);
  }

  // Exhibitions, Galleries, Buildings routes
  if (
    parsedUrl.pathname.startsWith("/exhibitions") ||
    parsedUrl.pathname.startsWith("/galleries") ||
    parsedUrl.pathname.startsWith("/buildings")
  ) {
    if (handleExhibitions && typeof handleExhibitions === 'function') {
      return handleExhibitions(req, res, parsedUrl);
    } else {
      console.error("❌ handleExhibitions is not available!");
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Exhibitions handler not available" }));
      return;
    }
  }

  // Reports
  console.log("Checking route for reports:", parsedUrl.pathname);
  if (
    parsedUrl.pathname.startsWith("/reports") ||
    parsedUrl.pathname.startsWith("/queries")
  ) {
    console.log("✅ Reports route matched!");
    return handleReports(req, res, parsedUrl);
  }

  // 404 for unmatched routes
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ message: "Route not found" }));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});