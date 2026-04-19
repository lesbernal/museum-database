# Museum of Fine Arts, Houston (MFAH)

A comprehensive database management system for the Museum of Fine Arts, Houston (MFAH). The system lets visitors explore art, buy tickets, become members, and helps museum staff manage the collection and view reports.

## Hosted MFAH Application:
### https://museum-database.vercel.app/ 

## How to host the site locally:
1. cd museum-database
2. npm install
3. cd frontend\museum
4. npm run dev
5. cd backend
6. node server.js

## File Structure:
### frontend\museum
Language/Framework: JavaScript, React
#### cd src\components
- this folder contains admin specific pages
- consists of files for the admin dashboard (data entry forms, reports, etc)
#### cd src\pages
- this folder contains all non-admin pages, including the home page, artwork gallery, ticket purchasing page, etc.
#### cd src\styles
- this folder contains all css styling for the files in the "pages" and "components" folders



### backend
Language/Framework: JavaScript, Node JS
- server.js: connecting backend server
- db.js: connects to MySQL database
#### cd handlers
- this folder includes all files that route backend functions to APIs

## Additional Info:
- DBMS: MySQL