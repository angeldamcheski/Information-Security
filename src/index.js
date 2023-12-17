const express = require("express");
const pasth = require("path");
const bcrypt = require("bcrypt");
const collection = require("./config");
const session = require("express-session");
const emailRegex = /^(.+)@(yahoo\.com|gmail\.com|outlook\.com)$/i;
const { log } = require("console");
const app = express();
const speakeasy = require("speakeasy");
const qrcode = require("qrcode");

function isPasswordStrong(password) {
  const passwordRegex =
    /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+])[A-Za-z\d!@#$%^&*()_+]{8,}$/;
  return passwordRegex.test(password);
}
function authorize(isAdmin) {
  return (req, res, next) => {
    if (req.session.user && req.session.user.isAdmin === true) {
      next();
    } else {
      res.status(403).send("Access Forbidden");
    }
  };
}
app.use(
  session({
    secret: "secret1234",
    resave: false,
    saveUninitialized: false,
  })
);
app.use((req, res, next) => {
  res.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
  res.header("Pragma", "no-cache");
  res.header("Expires", "-1");
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set("view engine", "ejs");

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server started running on port: http://localhost:${PORT}`);
});
app.get("/", (req, res) => {
  res.redirect("/home");
});
app.get("/admin", async (req, res) => {
  if (req.session.user && req.session.user.isAdmin === true) {
    const allUsers = await collection.find({});
    res.render("admindashboard", { userList: allUsers });
  } else {
    res.status(403).send("Access forbidden");
  }
});
app.get("/home", (req, res) => {
  if (req.session.user && req.session.user._id) {
    console.log(req.session.user);
    res.render("home", { currentUser: req.session.user });
  } else {
    res.redirect("/login");
  }
});
app.get("/login", (req, res) => {
  res.render("login");
});
app.get("/register", (req, res) => {
  res.render("register");
});
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log("Session couldn't be destroyed");
    } else {
      res.redirect("/login");
    }
  });
});
//Registering the user
app.post("/register", async (req, res) => {
  const data = {
    name: req.body.username,
    email: req.body.email,
    password: req.body.password,
  };

  if (!emailRegex.test(data.email)) {
    return res.status(400).send("Invalid email format");
  }
  if (!isPasswordStrong(data.password)) {
    return res
      .status(400)
      .send(
        "Password should contain at least one capital letter, one number and one special character."
      );
  }

  const existingUser = await collection.findOne({ name: data.name });
  if (existingUser) {
    res.send("User already exists");
  } else {
    const secret = speakeasy.generateSecret({
      name: data.name,
    });
    data.secret = secret;
    const saltRound = 10;
    const salt = bcrypt.genSaltSync(saltRound);
    const hashedPassword = await bcrypt.hashSync(data.password, salt);
    data.password = hashedPassword;
    console.log(data);
    const userData = await collection.insertMany(data);
    res.redirect("/login");
  }
});

app.post("/login", async (req, res) => {
  try {
    const check = await collection.findOne({ name: req.body.username });
    if (!check) {
      res.status(404).send("Bad credentials");
    }
    const isPasswordCorrect = await bcrypt.compare(
      req.body.password,
      check.password
    );
    if (isPasswordCorrect) {
      req.session.user = check;
      //res.redirect("/home");
      res.redirect("/verify");
    } else {
      res.status(401).send("Bad credentials");
    }
  } catch {
    res.send("Wrong login information");
  }
});

app.get("/verify", async (req, res) => {
  if (
    req.session.user &&
    req.session.user.secret &&
    req.session.user.secret.otpauth_url
  ) {
    const qrcodeURL = await qrcode.toDataURL(
      req.session.user.secret.otpauth_url
    );
    res.render("verification-page", {
      qrUrl: qrcodeURL,
    });
  } else {
    return res.status(400).send("User not found");
  }
});

app.post("/verify", async (req, res) => {
  const userToken = req.body.token;
  const verified = speakeasy.totp.verify({
    secret: req.session.user.secret.base32,
    encoding: "base32",
    token: userToken,
  });
  if (verified) {
    res.redirect("/home");
  } else {
    res.send("Invalid user token");
  }
});
