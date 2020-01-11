//dotenv npm can store sensitive information in a .env file
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const findOrCreate = require("mongoose-findorcreate");
//cookie
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

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

//-----------------SET UP MONGOOSE------------------------//
mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser:true,useUnifiedTopology:true})
mongoose.set("useCreateIndex",true);

//Schema is a template of collection
const userSchema = new mongoose.Schema({
  email:String,
  password:String,
  //add this googleId for findOrCreate method
  googleId:String,
  secret:String
});

//use passport local mongoose
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

//initialize a model of data
const User = new mongoose.model("User",userSchema);

//create a local login strategy
passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

//this has to put here
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));
//-----------------RESTful API--------------------//
app.get("/",function(req,res){
  res.render("home");
});

//this method allows using google to register or login
app.get("/auth/google",
  passport.authenticate("google",{scope:['profile']})
);

app.get('/auth/google/secrets',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get("/login",function(req,res){
  res.render("login");
});

app.get("/register",function(req,res){
  res.render("register");
});

app.get("/secrets",function(req,res){
  User.find({"secret":{$ne: null}},function(err,foundUsers){
    if(err){
      console.log(err);
    }else{
      if(foundUsers){
        //usersWithSecrets is passed to ejs file
        res.render("secrets",{usersWithSecrets:foundUsers})
      }
    }
  });
});

app.get("/submit",function(req,res){
  if(req.isAuthenticated()){
    res.render("submit");
  }else{
    res.redirect("/login");
  }
});

app.post("/submit",function(req,res){
  //get input data from ejs file
  const submittedSecret = req.body.secret;
  User.findById(req.user.id,function(err,foundUser){
    if(err){
      console.log(err);
    }else{
        if(foundUser){
          foundUser.secret = submittedSecret;
          foundUser.save(function(){
            res.redirect("/secrets")
          });
        }
    }
  });


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
