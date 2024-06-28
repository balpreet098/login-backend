const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const {generateOTP,sendEmail} = require('./helper/helpers.js');
const mazehiimzaa = require("cookie-parser");
require("dotenv").config();

// const Homepage = require('./Homepage.jsx');

const coreOptions = {
  origin: "*",
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 204,        
  
};

const port = process.env.PORT || 4000;
const app = express();
app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,Content-type,Accept');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});

app.use(cors(coreOptions));
app.use(express.json());

app.use(mazehiimzaa());

app.use(require("body-parser").urlencoded({ extended: true }));

// Mongoose.................
console.log("object", process.env.MONGO_URL);

mongoose.connect(process.env.MONGO_URL)

  .then(() => {
    console.log("connected successfully");
  })
  .catch((err) => console.log(err));

// SCHEMA.....................................................

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  otp:String,
  isOtpVerified:Boolean,
});

const usermodel = mongoose.model("user", userSchema);

// console.log("isdhnfhiosadfhsdf")

// Registeration- api........................

app.post("/register", (req, res) => {
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


// new-appli

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

app.post("/login", async (req, res) => {
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




//FORGOT PASSWORD 
app.post('/forgot-password',async (req,res)=>{
  try{
    const {email} = req.body;
    let user = await usermodel.findOne({email:email});
    if(!user){
      return res.json({ msg: "User Not Found!" });
    }
    


    let getOtp = await generateOTP();

    let sendEmailMsg = await sendEmail(email, "Forgot Password", `Your One Time otp is : ${getOtp} `);
    if(sendEmailMsg=0) {
      return res.json({ msg: "Internal Server Error!" });
    }

    

    let updateUser = await usermodel.findOneAndUpdate({email:email},{otp:getOtp});
    console.log("updateUser",updateUser);
    return res.json({ msg: "OTP sended to you email please verify" });

  }catch(err){
    console.log(err)
    return res.json({ msg: "Internal Server Error!" });
  }



});

app.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    let user = await usermodel.findOne({ email, otp });

    if (!user) {
      return res.status(400).json({ msg: "Invalid OTP. Please try again." });
    }


    
    user.password = newPassword; 
    user.otp = '';
    await usermodel.findOneAndUpdate({email:email},user);

    return res.json({ msg: "Password updated successfully!" });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Internal Server Error!" });
  }
});


app.listen(port, () => {
  console.log(`server is running on port ${port}`);
});

// app.listen(port, () => {
//   console.log(`Server is running on port ${port}`);
// });
