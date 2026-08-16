const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const indexPath = path.join(distDir, 'index.html');

let html = fs.readFileSync(indexPath, 'utf8');

if (!html.includes('rel="manifest"')) {
  html = html.replace(
    '</head>',
    `<link rel="manifest" href="/manifest.json"/>
<link rel="apple-touch-icon" href="/logo192.png"/>
<script>
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js');
    });
  }
</script>
</head>`
  );
  fs.writeFileSync(indexPath, html);
  console.log('Patched index.html with PWA tags');
} else {
  console.log('PWA tags already present');
}
