//dotenv npm can store sensitive information in a .env file
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
//md5 is a hash encriptyon module
const md5 = require("md5");

const app =express();

app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));

mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser:true,useUnifiedTopology:true})

const userSchema = new mongoose.Schema({
  email:String,
  password:String
});

const User = new mongoose.model("User",userSchema);
//-----------------RESTful API--------------------//
app.get("/",function(req,res){
  res.render("home");
});

app.get("/login",function(req,res){
  res.render("login");
});

app.get("/register",function(req,res){
  res.render("register");
});

app.post("/register",function(req,res){
  const newUser = new User({
    //req.body.<name in form>
    email: req.body.username,
    password:md5(req.body.password)
  });
  newUser.save(function(err){
    if(err){
      console.log(err);
    }else{
      res.render("secrets");
    }
  });
});
app.post("/login",function(req,res){
  const username = req.body.username;
  const password = md5(req.body.password);
  User.findOne({email:username},function(err,foundUser){
    if(foundUser){
      if(foundUser.password === password){
        res.render("secrets");
      }else{
        res.send("Password doesn't match")
      }
    }else{
      res.send("<h1>You are not a registered user, please sign up</h1>")
    }
  })
})
















app.listen(3000,function(){
  console.log("Server started on port 3000");
});
