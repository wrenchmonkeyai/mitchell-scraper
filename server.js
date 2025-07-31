const express = require("express");
const puppeteer = require("puppeteer");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.post("/api/torque", async (req, res) => {
  const { username, password, year, make, model, component } = req.body;

  if (!username || !password || !year || !make || !model || !component) {
    return res.status(400).json({ error: "❌ Missing required fields" });
  }

  let browser;
  try {
    console.log("🧠 Launching Puppeteer...");
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      timeout: 20000,
    });

    const page = await browser.newPage();

    console.log("🌐 Navigating to Mitchell login page...");
    await page.goto(
      "https://aui.mitchell1.com/Login?y=tusc1&exitUrl=https://www.prodemand.com&rememberPassword=True&autoLogin=True",
      { waitUntil: "domcontentloaded" }
    );

    console.log("🔐 Typing credentials...");
    await page.type("#username", username);
    await page.type("#password", password);
    await page.click("#loginButton");

    console.log("⏳ Waiting for post-login redirect...");
    await page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 15000 });

    const isLoggedIn = await page.evaluate(() =>
      !!document.querySelector("a[href*='logout']") || document.body.innerText.includes("Welcome")
    );

    if (!isLoggedIn) {
      throw new Error("❌ Login failed – check credentials or 2FA settings");
    }

    console.log("✅ Login successful.");
    console.log(`🔍 Fetching mock data for ${year} ${make} ${model} – ${component}`);

    // Replace this with real scraping logic later
    const mockResult = `Torque spec for ${component} on ${year} ${make} ${model}: 23 ft-lbs (mock data)`;

    return res.json({ result: mockResult });
  } catch (err) {
    console.error("🔥 Error in /api/torque:", err);
    return res.status(500).json({ error: err.message });
  } finally {
    if (browser) {
      console.log("💨 Closing browser");
      await browser.close();
    }
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Mitchell scraper service running on port ${PORT}`);
});

