const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { generateOTP, sendEmail } = require("./helper/helpers.js");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const bcrypt = require("bcrypt");
const PORT = process.env.PORT || 4000;
const saltRounds = 10; // Number of salt rounds for hashing
let whitelist = [
  process.env.FRONT_END_BASE_URL || "http://localhost:5174",
  "http://localhost:5174",
  "https://auth-server-tyzy.onrender.com",
  "http://localhost:4000",
];
const corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
  credentials: true,
};
const port = process.env.PORT || 4000;
const app = express();
app.use(cookieParser());
app.use(cors(corsOptions));
if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => { 
    res.header("Access-Control-Allow-Origin", req.headers.origin);
    res.header("Access-Control-Allow-Credentials", true);
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
  });
}
app.use(express.json());
app.use(require("body-parser").urlencoded({ extended: true }));
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("connected successfully");
  })
  .catch((err) => console.log(err));
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  otp: String,
  isOtpVerified: Boolean,
});
const usermodel = mongoose.model("user", userSchema);
app.post("/register", async (req, res) => {
  const { username, password, email } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user with hashed password
    const user = await usermodel.create({
      username,
      password: hashedPassword,
      email,
    });

    res.json(user);
  } catch (err) {
    res.status(500).json(err);
  }
});
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
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Email and password received:", email, password);

    // Find the user by email
    let user;
    try {
      user = await usermodel.findOne({ email });
    } catch (dbError) {
      console.error("Database query error:", dbError);
      return res
        .status(500)
        .json({ msg: "Internal Server Error!", error: dbError });
    }

    if (!user) {
      console.log("User not found");
      return res
        .status(400)
        .json({ msg: "Invalid email or password.", isUserLogin: false });
    }

    console.log("User found:", user);

    // Compare the provided password with the stored hashed password
    let isMatch;
    try {
      isMatch = await bcrypt.compare(password, user.password);
    } catch (bcryptError) {
      console.error("Password comparison error:", bcryptError);
      return res
        .status(500)
        .json({ msg: "Internal Server Error!", error: bcryptError });
    }

    console.log("Password match status:", isMatch);

    if (!isMatch) {
      return res
        .status(400)
        .json({ msg: "Invalid email or password.", isUserLogin: false });
    }

    // Generate an auth token
    const authToken = jwt.sign(
      { userId: user._id, email: user.email },
      "secret_key",
      { expiresIn: "1h" } // Adjust the expiration as needed
    );

    console.log("Auth token generated:", authToken);

    // Set the auth token as a cookie
    res.cookie("authToken", authToken, {
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 12 * 12 * 50 * 50 * 1000,
    });

    return res.json({ msg: "Login successful", isUserLogin: true });
  } catch (error) {
    console.error("Error during login:", error);
    return res.status(500).json({ msg: "Internal Server Error!", error });
  }
});
app.post("/forgot-password", async (req, res) => {
  try {
    console.log("object");
    const { email } = req.body;
    let user = await usermodel.findOne({ email: email });
    if (!user) {
      return res.status(404).json({ msg: "User Not Found!" });
    }

    let getOtp = await generateOTP();

    let sendEmailMsg = await sendEmail(
      email,
      "Forgot Password",
      `Your One Time otp is : ${getOtp} `
    );
    if ((sendEmailMsg = 0)) {
      return res.json({ msg: "Internal Server Error!" });
    }

    let updateUser = await usermodel.findOneAndUpdate(
      { email: email },
      { otp: getOtp }
    );
    console.log("updateUser", updateUser);
    return res
      .status(200)
      .json({ msg: "OTP sended to you email please verify" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ msg: "Internal Server Error!" });
  }
});
app.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.query;

    // Validate input
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ msg: "All fields are required." });
    }

    // Find user by email
    let user = await usermodel.findOne({ email });

    if (!user) {
      return res.status(400).json({ msg: "Email does not exist." });
    }

    // Check OTP
    if (user.otp !== otp) {
      return res.status(400).json({ msg: "Invalid OTP. Please try again." });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update user's password and clear the OTP
    user.password = hashedPassword;
    user.otp = "";

    await user.save();

    return res.json({ msg: "Password updated successfully!" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Internal Server Error!" });
  }
});
app.listen(port, () => {
  console.log(`server is running on port ${port}`);
});
