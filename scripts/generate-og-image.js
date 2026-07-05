// Screenshots the homepage hero for assets/og-image.jpg.
// Usage: node scripts/generate-og-image.js <url> <outputPath>
const { chromium } = require('playwright');

const url = process.argv[2];
const outPath = process.argv[3];

if (!url || !outPath) {
    console.error('Usage: node generate-og-image.js <url> <outputPath>');
    process.exit(1);
}

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({
        viewport: { width: 1200, height: 630 },
        deviceScaleFactor: 2, // supersample then let JPEG quality:100 keep it crisp
        locale: 'en-US',
    });
    await page.goto(url, { waitUntil: 'networkidle' });
    // Slight zoom so the hero fills the card instead of leaving empty margins
    await page.evaluate(() => { document.documentElement.style.zoom = '1.05'; });
    await page.waitForTimeout(1500); // let hero fade-up animations finish
    await page.screenshot({ path: outPath, type: 'jpeg', quality: 100 });
    await browser.close();
})();
