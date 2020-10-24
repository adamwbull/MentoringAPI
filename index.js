var express = require("express");
var bodyParser = require("body-parser");
var sql = require("mssql");
var cors = require("cors");
var app = express();

process.env.TZ = 'America/Los_Angeles';

app.use(bodyParser.json());
app.use(cors());

var config = require('./config.js');

// ------------------------------------- //
//          Appointment Table            //
// ------------------------------------- //

// GET all Appointments
app.get('/all-appointments', function (req, res) {

  sql.connect(config, function (err) {

    if (err) console.log(err);

    var request = new sql.Request();
    request.query('select * from [Appointment]', function (err, set) {

      if (err) console.log(err);
      res.send(set);

    });

  });

});

// GET Appointment by PairId
app.get('/appointment/:PairId', function(req, res) {

  var pairId = req.params.PairId;

  sql.connect(config, function (err) {

    if (err) console.log(err);

    var request = new sql.Request();

    request.input('input', sql.Int, pairId)
    .query('select * from [Appointment] where PairId=@input', function (err, set) {

      if (err) console.log(err);
      res.send(set);

    });

  });

});

// POST create appointment (provide PairId, ScheduledAt)
app.post('/create-appointment', function(req, res) {

  var pairId = req.body.PairId;
  var scheduledAt = req.body.ScheduledAt;
  var date = new Date();
  // .toISOString().slice(0, 19).replace('T', ' ')

  sql.connect(config, function (err) {

    if (err) console.log(err);

    var request = new sql.Request();

    request
    .input('PairId', sql.Int, pairId)
    .input('ScheduledAt', sql.SmallDateTime, scheduledAt)
    .input('Status', sql.VarChar(12), 'Pending')
    .input('Created', sql.SmallDateTime, date)
    .input('LastUpdate', sql.SmallDateTime, date)
    .query('insert into [Appointment] (PairId, ScheduledAt, Status, Created, LastUpdate)'
     + ' values (@PairId, @ScheduledAt, @Status, @Created, @LastUpdate)', function(err, set) {

       if (err) console.log(err);
       res.send(set);

     });

  });

});

app.post('/update-appointment-status', function(req, res) {

  var status = req.body.Status;
  var id = req.body.Id;

  sql.connect(config, function (err) {

    if (err) console.log(err);

    var request = new sql.Request();

    request
    .input('Status', sql.VarChar(12), status)
    .input('Id', sql.Int, id)
    .query('update [Appointment] set Status=@Status where Id=@Id', function(err, set) {

      if (err) console.log(err);
      res.send(set);

    });

  });

});

// ------------------------------------- //
//              User Table               //
// ------------------------------------- //

// GET all Users
app.get('/all-users', function (req, res) {

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
