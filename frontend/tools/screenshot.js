const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  const url = process.argv[2] || 'http://localhost:5173';
  const outDir = path.join(__dirname, '..', 'screenshots');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  const viewports = [
    { name: 'desktop', width: 1366, height: 768 },
    { name: 'tablet', width: 820, height: 1180 },
    { name: 'mobile', width: 390, height: 844 },
  ];

  for (const vp of viewports) {
    await page.setViewport({ width: vp.width, height: vp.height });
    await page.goto(url, { waitUntil: 'networkidle2' });
    // espera extra para sockets/animaciones
    await page.waitForTimeout(600);
    const file = path.join(outDir, `preview-${vp.name}.png`);
    await page.screenshot({ path: file, fullPage: false });
    console.log('Saved', file);
  }

  await browser.close();
})();