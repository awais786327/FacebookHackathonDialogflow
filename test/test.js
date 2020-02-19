const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, "../system/lock.txt");
console.log('file >> ', file);
const content = fs.createReadStream(file, 'utf8');
console.log('createReadStream >> ', content);
