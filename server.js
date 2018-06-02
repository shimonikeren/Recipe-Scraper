var express = require("express");
var exphbs  = require('express-handlebars');
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var request = require('request');
var cheerio = require("cheerio");
var axios = require("axios");
// Require all models
var db = require("./models");

var PORT = process.env.PORT || 3000;

var app = express();

// If deployed, use the deployed database. Otherwise use the local mongoHeadlines database
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";
// Set mongoose to leverage built in JavaScript ES6 Promises
// Connect to the Mongo DB
mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI);

app.use(bodyParser.json());
// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({ extended: true }));
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));
app.engine('handlebars', exphbs({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');

app.get('/', function (req, res) {
    res.render('index');
});

// A GET route for scraping 
app.get("/scrape", function(req, res) {
request("https://www.allrecipes.com/recipes/84/healthy-recipes/", function(error,     response, html) {
    if (error){
      return res.json(error);
    }
  
  var $ = cheerio.load(html);

  var results = [];

  $("img.fixed-recipe-card__img").each(function(i, element) {
    var title = $(element).attr("title");
    var imgURL = $(element).attr("data-original-src");
    var link = $(element).parent().attr("href");
      if (title && imgURL && link){
        results.push({
          title: title,
          imgURL: imgURL,
          link: link
        });
      }
  });

  // Create a new Article using the `result` object built from scraping
  db.Article.create(results)
    .then(function(dbArticle) {
      // return res.status(200);
      console.log("DB ARTICLE---------------------------");
      console.log(dbArticle);
    })
    .catch(function(err) {
      return res.json(err);
    });
  });
  res.redirect("/articles");
  // res.json(dbArticle);
  // res.redirect("all");
  // res.send("done");  //this is working 
});


//get all articles from db 
app.get("/articles", function(req, res){
  db.Article.find({}).then(function (dbArticle) {
      res.json(dbArticle);
      // res.send(dbArticle);
      res.render('all');
  })
      .catch(function (err) {
          res.json(err);
      });
});

//save article route //update... save=true 
//delete article route

// Start the server
app.listen(PORT, function() {
    console.log("App running on port " + PORT + "!");
  });