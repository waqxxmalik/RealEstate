var express = require("express"),
    app = express(),
    bodyParser = require("body-parser"),
    mongoose    = require("mongoose"),
    passport    = require("passport"),
    LocalStrategy = require("passport-local"),
	 cookieParser = require("cookie-parser"),
    flash        = require("connect-flash"),
 Property  = require("./models/property"),
    User        = require("./models/user"),
    session = require("express-session"),
    methodOverride = require("method-override");

    mongoose.connect("mongodb+srv://waqasarif:dravid@cluster0.hn1lhp7.mongodb.net/Mydata?retryWrites=true&w=majority", { useUnifiedTopology: true }
    ,{ useNewUrlParser: true })
.then(() => console.log(`Database connected`))
.catch(err => console.log(`Database connection error: ${err.message}`));


app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "public"));
app.use(methodOverride('_method'));
app.use(cookieParser('secret'));
//require mome //seed the database

// PASSPORT CONFIGURATION
app.use(require("express-session")({
    secret: "Once again Rusty wins cutest dog!",
    resave: false,
    saveUninitialized: false
}));

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
   res.locals.currentUser = req.user;
   res.locals.success = req.flash('success');
   res.locals.error = req.flash('error');
   next();
});

app.get("/", function(req, res){
	res.render("home")
});

app.get("/home", function(req, res){
	res.render("home")
});
app.get("/about", function(req, res){
	res.render("about")
});

app.get("/contact", function(req, res){
	res.render("contact")
});

app.get("/listing", function(req, res){
	res.render("listings")
});



app.get("/", function(req, res){
    var noMatch = null;
    if(req.query.search) {
        // Get all campgrounds from DB

         Property.find(

            {

                "$or":[
                    {name:new RegExp(escapeRegex(req.query.search), 'gi')},
                    {dodo:new RegExp(escapeRegex(req.query.search), 'gi')}
                ]
            }, function(err, allproperties){
             if(err){
                console.log(err)
             } else {
                if(allproperties.length < 1) {
                    noMatch = "No property match that query, please try again.";
                }
                res.render("index",{propertys:allproperties, noMatch: noMatch});

             }
            })
        } else {
        // Get all propertys from DB
        Property.find({}, function(err, allproperties){
           if(err){
               console.log(err);
           } else {
              res.render("index",{properties: allproperties, noMatch: noMatch});
           }
        });
    }

});



app.post("/", isLoggedIn, function(req, res){
  // get data from form and add to campgrounds array
  var name = req.body.name;
  var image = req.body.image;
  var desc = req.body.description;
  var dodo = req.body.dodo;
  var author = {
      id: req.user._id,
      username: req.user.username
  }
    var newCampground = {name: name, image: image, description: desc, dodo:dodo,  author:author};
    // Create a new campground and save to DB
    Campground.create(newCampground, function(err, newlyCreated){
        if(err){
            console.log(err);
        } else {
            //redirect back to campgrounds page
            console.log(newlyCreated);
            res.redirect("/campgrounds");
        }
    });
  });


app.get("/property/new", function(req, res){
   res.render("new");
});

  //render edit template with that campground

app.get("/viewproperty", function(req, res){
	res.render("view_property")
});


app.get("/register", function(req, res){
	res.render("register")
})
app.post("/register", function(req, res){
	var newuser = new User({username: req.body.username})
	User.register(newuser, req.body.password, function(err, user){
       if (err){
           req.flash("error", err.message);
           return res.redirect("register");
       }
       passport.authenticate("local")(req, res, function(){
            req.flash("success", "Welcome to YelpCamp " + user.username);
            res.redirect("/campgrounds") ;
       });
   });
});
app.get("/login", function(req, res) {
    res.render("login");
	req.flash("error", "You must have to Login First")
});

app.post("/login", passport.authenticate("local", {
        successRedirect: "/campgrounds",
        failureRedirect: "/login",
        failureFlash: true
    }), function(req, res) {
});
app.get("/logout", function(req, res) {
    req.flash("success", "Come back soon " + req.user.username + "!")
    req.logout();
    res.redirect("/campgrounds");
});



  function isLoggedIn(req, res, next){
      if(req.isAuthenticated()){
          return next();
      }
      req.flash('error', 'You must be signed in to do that!');
      res.redirect('/login');
  }


   function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};



app.listen(process.env.PORT || 3020, function(req, res){
	console.log("server started on")
});