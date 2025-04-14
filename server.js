const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const session = require("express-session");
const path = require("path");

const app = express();
const PORT = 8055;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

// Session Setup
app.use(
  session({
    secret: "surakshaSecretKey",
    resave: false,
    saveUninitialized: true,
  })
);

// MySQL Connection
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "123456",
  database: "suraksha",
});

connection.connect((err) => {
  if (err) throw err;
  console.log("Connected to MySQL database");
});

// ✅ Middleware for Route Protection
function isAuthenticated(role) {
  return function (req, res, next) {
    if (req.session.user && req.session.user.role === role) {
      next();
    } else {
      res.redirect(role === "doctor" ? "/dlogin" : "/plogin");
    }
  };
}

// =================== ROUTES ===================

// Public Pages
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/home.html");
});
app.get("/dsignup", (req, res) => {
  res.sendFile(__dirname + "/dsignup.html");
});
app.get("/dlogin", (req, res) => {
  res.sendFile(__dirname + "/dlogin.html");
});
app.get("/psignup", (req, res) => {
  res.sendFile(__dirname + "/psignup.html");
});
app.get("/plogin", (req, res) => {
  res.sendFile(__dirname + "/plogin.html");
});

// 🔐 Doctor Sign Up
app.post("/dsignup", (req, res) => {
  const {
    username,
    password,
    full_name,
    email,
    phone,
    registration_number,
    city,
    clinic_address,
    specialization,
    experience,
  } = req.body;

  connection.query(
    `INSERT INTO doctors 
      (username, password, full_name, email, phone, registration_number, city, clinic_address, specialization, experience)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      username,
      password,
      full_name,
      email,
      phone,
      registration_number,
      city,
      clinic_address,
      specialization,
      experience,
    ],
    (err) => {
      if (err) {
        console.error(err);
        res.send("Error creating doctor account.");
      } else {
        res.send("Doctor account created successfully! <a href='/dlogin'>Login here</a>");
      }
    }
  );
});

// 🔐 Patient Sign Up
app.post("/psignup", (req, res) => {
  const {
    username,
    password,
    full_name,
    email,
    age,
    gender,
    phone,
    city,
    address,
    medical_history,
  } = req.body;

  connection.query(
    `INSERT INTO patients 
      (username, password, full_name, email, age, gender, phone, city, address, medical_history)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      username,
      password,
      full_name,
      email,
      age,
      gender,
      phone,
      city,
      address,
      medical_history,
    ],
    (err) => {
      if (err) {
        console.error(err);
        res.send("Error creating patient account.");
      } else {
        res.send("Patient account created successfully! <a href='/plogin'>Login here</a>");
      }
    }
  );
});

// 🔐 Doctor Login
app.post("/dlogin", (req, res) => {
  const { username, password } = req.body;

  connection.query(
    `SELECT * FROM doctors WHERE username = ? AND password = ?`,
    [username, password],
    (err, results) => {
      if (err || results.length === 0) {
        return res.send("Invalid credentials. <a href='/dlogin'>Try again</a>");
      }

      req.session.user = {
        role: "doctor",
        username: results[0].username,
        full_name: results[0].full_name,
      };

      res.redirect("/doctor/home");
    }
  );
});

// 🔐 Patient Login
app.post("/plogin", (req, res) => {
  const { username, password } = req.body;

  connection.query(
    `SELECT * FROM patients WHERE username = ? AND password = ?`,
    [username, password],
    (err, results) => {
      if (err || results.length === 0) {
        return res.send("Invalid credentials. <a href='/plogin'>Try again</a>");
      }

      req.session.user = {
        role: "patient",
        username: results[0].username,
        full_name: results[0].full_name,
      };

      res.redirect("/patient/home");
    }
  );
});

// ✅ Doctor Home (Protected)
app.get("/doctor/home", isAuthenticated("doctor"), (req, res) => {
    res.render("dhome", { full_name: req.session.user.full_name });
});

// ✅ Patient Home (Protected)
app.get("/patient/home", isAuthenticated("patient"), (req, res) => {
    res.render("phome", { full_name: req.session.user.full_name });
});

// 🔓 Logout
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
