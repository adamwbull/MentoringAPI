var express = require("express");
var bodyParser = require("body-parser");
var sql = require("mssql");
var cors = require("cors");
var app = express();

app.use(bodyParser.json());
app.use(cors());

var config = require('./config.js');

// GET all Users
app.get('/allusers', function (req, res) {

  sql.connect(config, function (err) {

    if (err) console.log(err);

    var request = new sql.Request();
    request.query('select * from [User]', function (err, set) {

      if (err) console.log(err);
      res.send(set);

    });

  });

});

// GET User by Id
app.get('/user/:userId', function(req, res) {

  var userId = req.params.userId;

  sql.connect(config, function (err) {

    if (err) console.log(err);

    var request = new sql.Request();

    request.input('input', sql.Int, userId)
    .query('select * from [User] where Id=@input', function (err, set) {

      if (err) console.log(err);
      res.send(set);

    });

  });

});

var server = app.listen(process.env.PORT || 3000, function () {
  var port = server.address().port;
  console.log("App live on port", port);
});
