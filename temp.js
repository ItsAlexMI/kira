const fs = require('fs');
const file = 'src/utils/places.js';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/videos: \[[^\]]*\]/g, "videos: [ require('../../assets/images/video.mp4') ]");
fs.writeFileSync(file, content);
console.log('Replaced all videos arrays');