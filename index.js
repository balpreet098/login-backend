const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const mazehiimzaa = require("cookie-parser");
require("dotenv").config();

// const Homepage = require('./Homepage.jsx');

const coreOptions = {
  origin: ["*", process.env.FRONT_END_BASE_URL],
  credentials: true,
};

const port = process.env.PORT || 4000;
const app = express();
app.use(cors(coreOptions));
app.use(express.json());

app.use(mazehiimzaa());

app.use(require("body-parser").urlencoded({ extended: true }));

// Mongoose.................
console.log("object", process.env.MONGO_URL);
mongoose
  .connect(process.env.MONGO_URL)

  .then(() => {
    console.log("connected successfully");
  })
  .catch((err) => console.log(err));

// SCHEMA.....................................................

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
});

const usermodel = mongoose.model("user", userSchema);

// console.log("isdhnfhiosadfhsdf")

// Registeration- api........................

app.post("/Register", (req, res) => {
  const { username, password, email } = req.body;

  usermodel
    .create({
      username,
      password,
      email,
    })
    .then((user) => res.json(user))
    .catch((err) => res.json(err));
});

// mew-appli

app.get("/tk", (req, res) => {
  try {
    // console.log(req.cookies.authToken,req.cookie)
    console.log("fufa agya", req.cookies["authToken"]);
    // console.log("ddd",req.cookie["authToken"]);
    //.json({aaaa:req.cookie["authToken"]});

    const secret_key = process.env.SECRET_KEY;

    const authToken = req.cookies.authToken;

    try {
      const decoded = jwt.verify(authToken, secret_key);

      res.status(200).send(decoded);
      console.log("Token is valid:", decoded);
    } catch (error) {
      res.status(401).send({ msg: "something went wrong or not authorised " });
      console.error("Token verification failed:", error.message);
    }
  } catch (error) {
    console.log(error);
  }
});

// Login- api.................................

app.post("/login", (req, res) => {
  console.log(req.body);

  const { email, password } = req.body;
  console.log(email, password);

  usermodel.findOne({ email }).then(async (user) => {
    console.log(user);

    if (user) {
      if (user.password === password) {
        const authToken = await jwt.sign(
          { userId: user._id, email: user.email },
          "secret_key"
        );
        // const refreshToken = jwt.sign({ userId: user.id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
        res.cookie("authToken", authToken, {
          path: "/",
          httpOnly: true,
          secure: true,
          sameSite: "none",
          // expires:new Date(Date.now()+900000),

          maxAge: 12 * 12 * 50 * 50 * 1000,
        });
        return res.json({ msg: "login successfully", isUserLogin: true });
      } else {
        return res.json({ msg: "wrongpassword", isUserLogin: false });
      }
    } else {
      return res.json({ msg: "wrong email or password", isUserLogin: false });
    }
  });
});

app.listen(port, () => {
  console.log(`server is running on port ${port}`);
});

// app.listen(port, () => {
//   console.log(`Server is running on port ${port}`);
// });
