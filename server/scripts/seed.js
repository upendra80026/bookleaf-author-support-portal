/**
 * Database Seed Script for BookLeaf Support Portal
 * Run with: npm run seed
 */

const fs = require('fs');
const path = require('path');
const store = require('../db/store');

console.log('--- BookLeaf Database Seeder ---');
const dbFile = path.join(__dirname, '../db/database.json');

if (fs.existsSync(dbFile)) {
  fs.unlinkSync(dbFile);
  console.log('Removed existing database.json for fresh initialization.');
}

store.seed();
console.log('Database successfully re-seeded with 10 authors, 18 books, and official test tickets!');
process.exit(0);
