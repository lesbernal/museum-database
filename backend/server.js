const http = require("http");
const url = require("url");

const handleArtists = require("./handlers/artists");
const handleCafeitem = require("./handlers/cafeitems");
const handleCafetransaction = require("./handlers/cafetransactions");
const handleCafetransactionitem = require("./handlers/cafetransactionitems");
const handleGiftshopitem = require("./handlers/giftshopitems");
const handleGiftshoptransaction = require("./handlers/giftshoptransactions");
const handleGiftshoptransactionitem = require("./handlers/giftshoptransactionitems");

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
    return handleCafeitem(req, res);
  }
  if (parsedUrl.pathname === "/giftshoptransactions") {
  return handleCafetransaction(req, res);
  }
  if (parsedUrl.pathname === "/giftshoptransactionitems") {
  return handleCafetransactionitem(req, res);
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ message: "Route not found" }));
});

server.listen(5000, () => {
  console.log("Server running on port 5000");
});