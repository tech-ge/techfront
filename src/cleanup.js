const fs = require('fs');
const path = require('path');

const files = [
  'pages/HomePage.js',
  'pages/Dashboard.js',
  'pages/ChatPage.js'
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Remove unused imports
  content = content.replace(/CardActions, /g, '');
  content = content.replace(/SettingsIcon, /g, '');
  content = content.replace(/ListItemText, /g, '');
  
  fs.writeFileSync(filePath, content);
  console.log(`Cleaned ${file}`);
});

console.log('✅ All files cleaned!');
