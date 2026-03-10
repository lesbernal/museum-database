# Museum Backend - Node.js + MySQL

This is the backend for the Museum Database project. It handles API handlers for artists, artworks, exhibitions, etc.

---

## 📁 Folder Structure
backend/
- handlers/ (API route files (e.g., artists.js, artworks.js))
- db.js (MySQL database connection)
- server.js (Main server file)
- package.json  

---

## ⚡ Prerequisites

- Node.js (v18+ recommended)
- MySQL Workbench or MySQL server installed locally
- npm (comes with Node.js)
- Git (to clone this repo)

---

## 🛠 Setup Instructions/commands

1. update repo on pc/vscode
- cd .\museum-database\ (to access repo)
- git pull origin main (pull changes)
- cd .\backend\ (to access backend folder)
- npm install (to install everything needed for backend (like dotenv))

2. set up mysql database locally
- install mysql installer (the 556.0M one)
- after setting up, create database in workbench (give it a name)
- copy/paste schema.sql into query 1 tab
- run it (⚡ button)

3. create .env file for passwords
- in the backend folder, create a file called ".env"
- copy/paste the info from the .env.example file into your .env file
- change the "your_mysql_password" to your password that you created when setting up mysql
- this .env file will not be pushed into the github dw

3. test backend connection on vscode
- make sure to cd into backend folder (if ur not already there)
- in vscode terminal: node server.js
- if you see "Server running on port 5000 Connected to MySQL!" you won!!
- search http://localhost:5000/artists to see if the info pulls up (change "artists" to the name of the handler file you're trying to see)

