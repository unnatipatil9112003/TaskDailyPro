import express from "express";
import User from "../models/User.js";
import { body, validationResult } from "express-validator";
const router = express.Router();
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
const JWT_SECRET = "Mangeshisgood$boy";
import fetchuser from "../middelware/fetchuser.js";
import validator from "validator";
import sendEmail from "../utils/email.js";
let success = false;
function countDigits(number) {
  let numString = Math.abs(number).toString();
  return numString.length;
}

// Route 1:create a user using POST:"/api/auth/createuser" no login required

router.post(
  "/createuser",
  [
    body("email", "Email must be valid email, varify your email").isEmail(),
    body("name", "Name field is required with at least 1 charater").isLength({
      min: 1,
    }),
    body("password", "passwords should be longer than 5 char.").isLength({
      min: 5,
    }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        success = false;
        return res.status(400).json({ success, errors: errors.array() });
      }

      let user = await User.findOne({ email: req.body.email });
      if (user) {
        success = false;
        return res.status(400).json({ success, errors: "User already exists" });
      }

      const salt = await bcrypt.genSalt(10);
      const secPass = await bcrypt.hash(req.body.password, salt);

      user = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: secPass,
      });
      const data = {
        user: {
          id: user.id,
        },
      };
      const authToken = jwt.sign(data, JWT_SECRET);
      success = true;
      res.json({ success, authToken });
    } catch (error) {
      success = false;
      console.error(error.message);
      res.status(500).send(success, "Internal Server Error" + error.message);
    }
  }
);

// Route 2:Authenticating user using POST:"/api/auth/login"  login required
router.post(
  "/login",
  [
    body("email", "Email must be valid email").isEmail(),
    body("password", "password should be provided").exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      success = false;
      return res.status(400).json({ success, errors: errors.array() });
    }
    const { email, password } = req.body;
    try {
      let user = await User.findOne({ email });
      if (!user) {
        success = false;
        return res.status(400).json({
          success,
          errors: "Please try to login with correct credentials",
        });
      }
      const passwordCompare = await bcrypt.compare(password, user.password);
      if (!passwordCompare) {
        success = false;
        return res.status(400).json({
          success,
          errors: "Please try to login with correct credentials",
        });
      }
      const data = {
        user: {
          id: user.id,
        },
      };
      success = true;
      const authToken = jwt.sign(data, JWT_SECRET);

      res.status(200).json({ success, authToken });
    } catch (err) {
      success = false;
      console.error(err.message);
      res.status(500).send(success, "Internal Server Error" + err.message);
    }
  }
);

// ROUTE 3: Get loggedin User Details using: POST "/api/auth/getuser". Login required
router.post("/getuser", fetchuser, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).send("User not exist");
    }
    res.json(user);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error " + error.message);
  }
});

//*edit profile : for the users to edit their profile
// algo :
//check if user is logged in and user exist ,
//get the data from the front end and validate it
//update the data in the database ,
//return the data,

// &Validation is remaining
router.put("/editprofile", fetchuser, async (req, res) => {
  try {
    if (!req.user.id) {
      return res.status(401).json("Login is required");
    }
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res
        .status(401)
        .json(401, "user does not exist !! create user first");
    }
    const { name, email, phone, whatsappNumber } = req.body;
    const newUser = {};

    if (!validator.isMobilePhone(phone, "en-IN", { strictMode: false })) {
      return res.status(400).json("Phone number should be of 10 digits");
    }
    if (
      !validator.isMobilePhone(whatsappNumber, "en-IN", { strictMode: false })
    ) {
      return res.status(400).json("Whatsapp number should be of 10 digits");
    }
    if (!validator.isEmail(email)) {
      return res.status(400).json("Invalid Email");
    }
    if (name) {
      newUser.name = name;
    }
    if (email) {
      newUser.email = email;
    }
    if (phone) {
      newUser.phone = phone;
    }
    if (whatsappNumber) {
      newUser.whatsappNumber = whatsappNumber;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        $set: {
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          whatsappNumber: newUser.whatsappNumber,
        },
      },
      { new: true }
    );
    console.log(updatedUser);
    res.status(200).json(updatedUser);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error while editing profile" + err.message);
  }
});

//change password
//change image
//change task/goal crediantials

//change password..
// algo
//check user is logged in first
//get new password and conform password from front end , validate it
//compare the password stored in the database in hashed form
//if the password is correct update the password in the database
//return the data

// * change password (with old password varification)
// &  login required
router.put("/changepassword", fetchuser, async (req, res) => {
  if (!req.user.id) {
    return res.status(401).json("Login is required");
  }
  const user = await User.findById(req.user.id);
  if (!user) {
    return res
      .status(401)
      .json(401, "user does not exist !! create user first");
  }
  const { oldPassword, newPassword, conformPassword } = req.body;
  if (!newPassword || !conformPassword || !oldPassword) {
    return res
      .status(400)
      .json("new password , conform password and old password are required");
  }
  if (newPassword !== conformPassword) {
    return res
      .status(400)
      .json("new password and conform password should be same");
  }
  console.log("Old Password:", oldPassword);
  console.log("User Password:", user.password);
  bcrypt.compare(oldPassword.toString(), user.password, async (err, result) => {
    if (err) {
      res.status(500).json("Old password is incorrect:" + err);
    } else {
      console.log("Password Match:", result);
      if (result) {
        bcrypt.hash(newPassword, 10, async (err, hash) => {
          if (err) {
            res.status(500).json("Error while hashing password:" + err);
          } else {
            const newUser = await User.findByIdAndUpdate(
              req.user.id,
              {
                $set: {
                  password: hash,
                },
              },
              { new: true }
            );
            res.status(200).json(newUser);
          }
        });
      }
    }
  });
});

// *forgot password (also used for reset password with otp)
// algo
//get user email. from the front end
//check if the user exist accoring to the email,
//if user is present accoring to the email , then send otp to that email, else return error
//ask for the otp , and coampare it with the otp stored in the database
//if otp matched then ask to create new password and provide the mentod to create new password

//& no login required
router.post("/forgotPasswordgetOtp", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User does not exist" });
    }
    const otp = Math.floor(100000 + Math.random() * 900000);
    user.otp = otp;

    await user.save();
    sendEmail(user.otp, email);
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Error while sending otp" });
  }
});

//validating otp.. on the email address
router.get("/otp/validate", async (req, res) => {
  const { email, otp } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User does not exist" });
    }
    if (user.otp === otp) {
      return res
        .status(200)
        .json({ success: true, message: "OTP verified successfully" });
    } else {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }
  } catch (error) {
    console.log(error);
    return res.status(400).json({ success: false, message: "Error" });
  }
});

//change password after validating otp
//& no login required
router.get("/password/change", async (req, res) => {
  const { email, password, conformPassword } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User does not exist" });
    }
    if (password !== conformPassword) {
      return res
        .status(400)
        .json("new password and conform password should be same");
    }
    user.password = password;
    await user.save();
    return res
      .status(200)
      .json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    res
      .status(error.statusCode)
      .json({ success: false, message: error.message });
  }
});
export default router;