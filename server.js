const express = require("express");
const puppeteer = require("puppeteer");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Basic login and scrape handler
app.post("/api/torque", async (req, res) => {
  const { username, password, year, make, model, component } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Missing credentials" });
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
    const page = await browser.newPage();

    // Login flow
    await page.goto("https://aui.mitchell1.com/Login?y=tusc1&exitUrl=https://www.prodemand.com&rememberPassword=True&autoLogin=True", {
      waitUntil: "networkidle2",
    });

    await page.type("#username", username);
    await page.type("#password", password);
    await page.click("#loginButton");

    await page.waitForNavigation({ waitUntil: "networkidle2" });

    const isLoggedIn = await page.evaluate(() =>
      !!document.querySelector("a[href*='logout']") || document.body.innerText.includes("Welcome")
    );

    if (!isLoggedIn) {
      throw new Error("Login failed – check credentials or 2FA settings");
    }

    // Mock response — replace with real scraping logic
    const mockData = `Torque spec for ${component} on ${year} ${make} ${model}: 23 ft-lbs (mock data)`;

    res.json({ result: mockData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    if (browser) await browser.close();
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
