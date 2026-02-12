const express = require("express");
const fs = require("fs");
const path = require("path");
const session = require("express-session");
require("dotenv").config();
const test_case = require("./config/test-case-generater");
const authMiddleware = require("./middleware/auth");
const { exportToDocx } = require("./config/export-docs");

const app = express();
const PORT =process.env.PORT ?? 5000;

app.use(express.json({ limit: "50mb" }));

// session setup
app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60, // 1 hour
    },
  })
);

// serve login page always
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

// login api
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  // Hardcoded credentials (you can move to .env)
  if (username === process.env.ADMIN_USER&& password === process.env.ADMIN_PASS) {
    req.session.user = { username };
    return res.json({ success: true, message: "Login success" });
  }

  return res.status(401).json({ success: false, message: "Invalid credentials" });
});

// logout api
app.post("/api/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true, message: "Logged out" });
  });
});

// protect dashboard
app.get("/", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  return res.sendFile(path.join(__dirname, "public", "index.html"));
});

// protect static assets except login.html
app.use("/assets", express.static(path.join(__dirname, "public", "assets")));

// Protected API routes
const filePath = path.join(__dirname, "config/test-env.json");
const reportsDir = path.join(__dirname, "reports");

// create reports folder if not exists
if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir);

// ---------------------
// GET ALL TEST CASES
// ---------------------
app.get("/api/tests", authMiddleware, (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------------------
// SAVE ALL TEST CASES
// ---------------------
app.post("/api/tests/save", authMiddleware, (req, res) => {
  try {
    const newData = req.body;

    if (!Array.isArray(newData)) {
      return res.status(400).json({ success: false, message: "Invalid JSON format" });
    }

    fs.writeFileSync(filePath, JSON.stringify(newData, null, 2));
    res.json({ success: true, message: "✅ Test cases saved successfully!" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------------------
// RUN SINGLE TEST
// ---------------------
app.post("/api/tests/run-one", authMiddleware, async (req, res) => {
  try {
    const { test, token, publicKey } = req.body;

    const result = await test_case.commonReq_apis(
      test.test_name,
      test.request_url,
      test.request_body,
      test.method,
      token,
      publicKey
    );

    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------------------
// RUN ALL TESTS
// ---------------------
app.post("/api/tests/run-all", authMiddleware, async (req, res) => {
  try {
    const { tests, publicKey } = req.body;

    let token = null;
    const results = [];

    for (let i = 0; i < tests.length; i++) {
      const t = tests[i];

      const passToken = t.requires_token ? token : null;

      const result = await test_case.commonReq_apis(
        t.test_name,
        t.request_url,
        t.request_body,
        t.method,
        passToken,
        publicKey
      );

      results.push(result);

      if (t.test_name === "Token Generation API--Success Cases") {
        token = result?.[t.test_name]?.Response?.data?.token;
      }
    }

    res.json({ success: true, results, token });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------------------
// EXPORT DOCX REPORT
// ---------------------
app.post("/api/tests/export-docx", authMiddleware, async (req, res) => {
  try {
    const { results } = req.body;

    const fileName = `API_TEST_REPORT_${Date.now()}.docx`;
    const fileFullPath = path.join(reportsDir, fileName);

    await exportToDocx(fileFullPath, results);

    res.json({
      success: true,
      message: "DOCX exported",
      file: fileName,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------------------
// DOWNLOAD REPORT (Protected)
// Auto delete after download
// ---------------------
app.get("/download/:file", authMiddleware, (req, res) => {
  try {
    const fileName = req.params.file;
    const fileFullPath = path.join(reportsDir, fileName);

    if (!fs.existsSync(fileFullPath)) {
      return res.status(404).send("File not found");
    }

    res.download(fileFullPath, fileName, (err) => {
      if (!err) {
        fs.unlinkSync(fileFullPath); // delete after download
      }
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running: http://localhost:${PORT}`);
});
