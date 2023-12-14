const express = require("express");
const pasth = require("path");
const bcrypt = require("bcrypt");
const collection = require("./config");
const session = require("express-session");

const { log } = require("console");
const app = express();
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
  console.log(`Server started running on port: ${PORT}`);
});

app.get("/home", (req, res) => {
  if (req.session.user && req.session.user._id) {
    console.log(req.session.user);
    res.render("home");
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
  const existingUser = await collection.findOne({ name: data.name });
  if (existingUser) {
    res.send("User already exists");
  } else {
    const saltRound = 10;
    const salt = bcrypt.genSaltSync(saltRound);
    //const hashedPassword = await bcrypt.hash(data.password, saltRound);
    const hashedPassword = await bcrypt.hashSync(data.password, salt);
    data.password = hashedPassword;
    console.log(data);
    const userData = await collection.insertMany(data);
    res.redirect("/login");
  }
});
//2FA
//Dokumentacija(sto se pravi kako se pravi, print screen od site mozni scenarija)
//Bad credentials
//Registracija: username, password jacina, da se proveri dali e mejl
//Login user
//Da se zacuva salt
app.post("/login", async (req, res) => {
  try {
    const check = await collection.findOne({ name: req.body.username });
    if (!check) {
      res.send("Username cannot be found");
    }
    const isPasswordCorrect = await bcrypt.compare(
      req.body.password,
      check.password
    );
    if (isPasswordCorrect) {
      req.session.user = check;
      res.redirect("/home");
    } else {
      res.send("Wrong password");
    }
  } catch {
    res.send("Wrond login information");
  }
});
