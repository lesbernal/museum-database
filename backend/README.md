# Museum Backend - Node.js + Express + MySQL

This is the backend for the Museum Database project. It handles API routes for artists, artworks, exhibitions, and other museum-related data. The backend uses **Express.js** and **MySQL**.

---

## 📁 Folder Structure
backend/
- routes/ (API route files (e.g., artists.js, artworks.js))
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
- cd museum-database
- git pull origin main (pull changes)
- cd backend
- npm install

2. set up mysql database locally
- install mysql installer (the 556.0M one)
- after setting up, create database in workbench (give it a name)
- copy/paste schema.sql into query 1 tab
- run it (⚡ button)

3. test backend connection on vscode
- make sure to cd into backend folder (if not already there)
- node server.js
- if you see "Server running on port 5000 Connected to MySQL!" you won!!

