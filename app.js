//dotenv npm can store sensitive information in a .env file
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
//cookie
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
//use bcrypt
const bcrypt = require('bcrypt');
const saltRound = 10;

const app =express();

app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));

//session has to be put right under all other app.use but
//beyond mongoose.connect
app.use(session({
  secret:"Our little secret.",
  resave:false,
  saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());

//--------------------------------------------------//

mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser:true,useUnifiedTopology:true})
mongoose.set("useCreateIndex",true);

const userSchema = new mongoose.Schema({
  email:String,
  password:String
});

//use passport local mongoose
userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User",userSchema);

//create a local login strategy
passport.use(User.createStrategy());
//create cookie
passport.serializeUser(User.serializeUser());
//destroy cookie
passport.deserializeUser(User.deserializeUser());

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

app.get("/secrets",function(req,res){
  //check if user already logged in using passport method
  if(req.isAuthenticated()){
    res.render("secrets");
  }else{
    res.redirect("/login");
  }
});

//logout method from passport
app.get("/logout",function(req,res){
  req.logout();
  res.redirect("/");

});

app.post("/register",function(req,res){

  User.register({username:req.body.username},req.body.password,function(err,user){
    if(err){
      console.log(err);
      res.redirect("/register");
    }else{
      passport.authenticate("local")(req,res,function(){
        res.redirect("/secrets");
      });
    }
  });
});

//using hash-salting method to authenticate
app.post("/login",function(req,res){
  const user = new User({
    username:req.body.username,
    password:req.body.password
  });

  req.login(user,function(err){
    if(err){
      res.redirect("/login");
    }else{
      passport.authenticate("local")(req,res,function(){
        res.redirect("/secrets");
      });
    }
  });
});
















app.listen(3000,function(){
  console.log("Server started on port 3000");
});
