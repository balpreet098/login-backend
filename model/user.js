// // const express= require("express")
// const mongoose = require('mongoose')
// const userSchema = new mongoose.Schema({


//       email: String,
//       password: String
      
// })

// const usermodel = mongoose.model("user", userSchema)



// app.post("/login", (req, res) => {



//       const { email, password } = req.body;
//       usermodel.findOne({ email: email })
//             .then(user => {






//                   if (user) {
//                         if (user.password === password) {
//                               res.json("login successfuly")
//                         }
//                         else {
//                               res.json("the password is incorrect")

//                         }
                  
                        
//                   }





//             })






// })




// module.exports = userSchema;

