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

// Helper function to set CORS headers (only if headers not sent)
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

  // TEST ENDPOINT - to verify CORS is working
  if (parsedUrl.pathname === "/test-cors") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ 
      message: "CORS is working!", 
      timestamp: Date.now(),
      cors: "Headers should be present"
    }));
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

  if (parsedUrl.pathname.startsWith("/cafeitems")) {
    if (typeof handleCafeitem === 'function') {
      return handleCafeitem(req, res, parsedUrl);
    } else {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Cafe items handler not configured properly" }));
      return;
    }
  }

  if (parsedUrl.pathname.startsWith("/cafetransactions")) {
    if (typeof handleCafetransaction === 'function') {
      return handleCafetransaction(req, res, parsedUrl);
    } else {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Cafe transactions handler not configured properly" }));
      return;
    }
  }

  if (parsedUrl.pathname.startsWith("/cafetransactionitems")) {
    if (typeof handleCafetransactionitem === 'function') {
      return handleCafetransactionitem(req, res, parsedUrl);
    } else {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Cafe transaction items handler not configured properly" }));
      return;
    }
  }

  if (parsedUrl.pathname.startsWith("/giftshopitems")) {
    if (typeof handleGiftshopitem === 'function') {
      return handleGiftshopitem(req, res, parsedUrl);
    } else {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Gift shop items handler not configured properly" }));
      return;
    }
  }

  if (parsedUrl.pathname.startsWith("/giftshoptransactions")) {
    if (typeof handleGiftshoptransaction === 'function') {
      return handleGiftshoptransaction(req, res, parsedUrl);
    } else {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Gift shop transactions handler not configured properly" }));
      return;
    }
  }

  if (parsedUrl.pathname.startsWith("/giftshoptransactionitems")) {
    if (typeof handleGiftshoptransactionitem === 'function') {
      return handleGiftshoptransactionitem(req, res, parsedUrl);
    } else {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Gift shop transaction items handler not configured properly" }));
      return;
    }
  }

  if (parsedUrl.pathname.startsWith("/tickets")) {
    if (typeof handleTickets === 'function') {
      return handleTickets(req, res, parsedUrl);
    } else {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Tickets handler not configured properly" }));
      return;
    }
  }

  if (parsedUrl.pathname.startsWith("/events")) {
    if (typeof handleEvents === 'function') {
      return handleEvents(req, res, parsedUrl);
    } else {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Events handler not configured properly" }));
      return;
    }
  }

  if (parsedUrl.pathname.startsWith("/donations")) {
    if (typeof handleDonations === 'function') {
      return handleDonations(req, res, parsedUrl);
    } else {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Donations handler not configured properly" }));
      return;
    }
  }

  if (parsedUrl.pathname.startsWith("/users")) {
    if (typeof handleUsers === 'function') {
      return handleUsers(req, res, parsedUrl);
    } else {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Users handler not configured properly" }));
      return;
    }
  }

  if (parsedUrl.pathname.startsWith("/employees")) {
    if (typeof handleEmployees === 'function') {
      return handleEmployees(req, res, parsedUrl);
    } else {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Employees handler not configured properly" }));
      return;
    }
  }

  if (parsedUrl.pathname.startsWith("/visitors")) {
    if (typeof handleVisitors === 'function') {
      return handleVisitors(req, res, parsedUrl);
    } else {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Visitors handler not configured properly" }));
      return;
    }
  }

  if (parsedUrl.pathname.startsWith("/members")) {
    if (typeof handleMembers === 'function') {
      return handleMembers(req, res, parsedUrl);
    } else {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Members handler not configured properly" }));
      return;
    }
  }

  if (parsedUrl.pathname.startsWith("/departments")) {
    if (typeof handleDepartments === 'function') {
      return handleDepartments(req, res, parsedUrl);
    } else {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Departments handler not configured properly" }));
      return;
    }
  }

  if (parsedUrl.pathname.startsWith("/giftshop")) {
    if (typeof handleGiftshop === 'function') {
      return handleGiftshop(req, res, parsedUrl);
    } else {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Gift shop handler not configured properly" }));
      return;
    }
  }

  if (parsedUrl.pathname.startsWith("/cafe")) {
    if (typeof handleCafe === 'function') {
      return handleCafe(req, res, parsedUrl);
    } else {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Cafe handler not configured properly" }));
      return;
    }
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

  // 404 for unmatched routes
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ message: "Route not found" }));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});