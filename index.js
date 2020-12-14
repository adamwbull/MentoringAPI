/*
API Dev Server for MentoringApp
To start: node index.js
Localtunnel: lt --port 3000 --subdomain mshipapp
*/
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
//        AppointmentSummary Table       //
// ------------------------------------- //

app.get('/all-summaries', function(req, res) {

  sql.connect(config, function (err) {

    if (err) console.log(err);

    var request = new sql.Request();

    request
    .query('select * from [AppointmentSummary] where PairId in (select Id from Pair where PrivacyAccepted=1)', function (err, set) {

      if (err) console.log(err);
      res.send(set);

    });

  });

});

app.get('/summary/pair/:PairId', function(req, res) {

  var pairId = req.params.PairId;

  sql.connect(config, function (err) {

    if (err) console.log(err);

    var request = new sql.Request();

    request.input('input', sql.Int, pairId)
    .query('select * from [AppointmentSummary] where PairId=@input', function (err, set) {

      if (err) console.log(err);
      res.send(set);

    });

  });

});

app.get('/summary/user/:UserId', function(req, res) {

  var userId = req.params.UserId;

  sql.connect(config, function (err) {

    if (err) console.log(err);

    var request = new sql.Request();

    request.input('input', sql.Int, userId)
    .query('select * from [AppointmentSummary] where UserId=@input', function (err, set) {

      if (err) console.log(err);
      res.send(set);

    });

  });

});

app.get('/summary/appointment/:AppointmentId', function(req, res) {

  var appointmentId = req.params.AppointmentId;

  sql.connect(config, function (err) {

    if (err) console.log(err);

    var request = new sql.Request();

    request.input('input', sql.Int, appointmentId)
    .query('select * from [AppointmentSummary] where AppointmentId=@input', function (err, set) {

      if (err) console.log(err);
      res.send(set);

    });

  });

});

app.post('/create-summary', function(req, res) {

  var appointmentId = req.body.AppointmentId;
  var summaryText = req.body.SummaryText;
  var userId = req.body.UserId;
  var pairId = req.body.PairId;
  var date = new Date();

  sql.connect(config, function (err) {

    if (err) console.log(err);

    var request = new sql.Request();

    request
    .input('AppointmentId', sql.Int, appointmentId)
    .input('SummaryText', sql.VarChar, summaryText)
    .input('UserId', sql.Int, userId)
    .input('Status', sql.VarChar, "Submitted")
    .input('Created', sql.SmallDateTime, date)
    .input('LastUpdate', sql.SmallDateTime, date)
    .input('PairId', sql.Int, pairId)
    .query('insert into [AppointmentSummary] (AppointmentId, SummaryText, UserId, Status, Created, LastUpdate, PairId) values (@AppointmentId, @SummaryText, @UserId, @Status, @Created, @LastUpdate, @PairId)', function(err, set) {

      if (err) console.log(err);
      res.send(set);

    });

  });

});

app.post('/update-summary', function(req, res) {

  var appointmentId = req.body.AppointmentId;
  var summaryText = req.body.SummaryText;
  var userId = req.body.UserId;
  var date = new Date();

  sql.connect(config, function (err) {

    if (err) console.log(err);

    var request = new sql.Request();

    request
    .input('AppointmentId', sql.Int, appointmentId)
    .input('SummaryText', sql.VarChar, summaryText)
    .input('UserId', sql.Int, userId)
    .input('Status', sql.VarChar, 'Edited')
    .input('LastUpdate', sql.SmallDateTime, date)
    .query('update [AppointmentSummary] set SummaryText=@SummaryText, LastUpdate=@LastUpdate, Status=@Status where AppointmentId=@AppointmentId and UserId=@UserId', function(err, set) {

      if (err) console.log(err);
      res.send(set);

    });

  });

});

// ------------------------------------- //
//              Pair Table               //
// ------------------------------------- //

app.get('/pair/mentor/:MentorId', function(req, res) {

  var mentorId = req.params.MentorId;

  sql.connect(config, function (err) {

    if (err) console.log(err);

    var request = new sql.Request();

    request.input('input', sql.Int, mentorId)
    .query('select * from [Pair] where MentorId=@input', function (err, set) {

      if (err) console.log(err);
      res.send(set);

    });

  });

});

app.get('/pair/mentee/:MenteeId', function(req, res) {

  var menteeId = req.params.MenteeId;

  sql.connect(config, function (err) {

    if (err) console.log(err);

    var request = new sql.Request();

    request.input('input', sql.Int, menteeId)
    .query('select * from [Pair] where MenteeId=@input', function (err, set) {

      if (err) console.log(err);
      res.send(set);

    });

  });

});

app.post('/create-pair', function(req, res) {

  var mentorId = req.body.MentorId;
  var menteeId = req.body.MenteeId;
  var date = new Date();
  var privacyAccepted = 0;
  var mentorPrivacyAccepted = 0;
  var menteePrivacyAccepted = 0;

  sql.connect(config, function (err) {

    if (err) console.log(err);

    var mentorPrivRequest = new sql.Request();

    mentorPrivRequest.input('MentorId', sql.Int, mentorId)
    .query('select PrivacyAccepted as priv from [User] where Id=@MentorId', function(err, set) {

      if (err) console.log(err);
      mentorPrivacyAccepted = set.recordset[0].priv;

      var menteePrivRequest = new sql.Request();

      menteePrivRequest.input('MenteeId', sql.Int, menteeId)
      .query('select PrivacyAccepted as priv from [User] where Id=@MenteeId', function(err, set) {

        if (err) console.log(err);
        menteePrivacyAccepted = set.recordset[0].priv;

        if (menteePrivacyAccepted == 1 && mentorPrivacyAccepted == 1) {
          privacyAccepted = 1;
        }

        var request = new sql.Request();

        request
        .input('MentorId', sql.Int, mentorId)
        .input('MenteeId', sql.Int, menteeId)
        .input('Date', sql.SmallDateTime, date)
        .input('PrivacyAccepted', sql.Int, privacyAccepted)
        .query('insert into [Pair] (MentorId, MenteeId, Created, LastUpdate, PrivacyAccepted) values (@MentorId, @MenteeId, @Date, @Date, @PrivacyAccepted)', function(err, set) {

          if (err) console.log(err);
          res.send(set);

        });

      });

    });

  });

});

app.post('/delete-pair', function(req, res) {

  var id = req.body.Id;

  sql.connect(config, function (err) {

    if (err) console.log(err);

    var request = new sql.Request();

    request
    .input('Id', sql.Int, id)
    .query('delete from [Pair] where Id=@Id', function(err, set) {

      if (err) console.log(err);
      res.send(set);

    });

  });

});

// ------------------------------------- //
//             Topic Table               //
// ------------------------------------- //

app.get('/current-topic', function(req, res) {

  sql.connect(config, function (err) {

    if (err) console.log(err);

    var request = new sql.Request();

    request
    .query('select * from [Topic] where Created in (select max(Created) as Created from [Topic])', function (err, set) {

      if (err) console.log(err);
      res.send(set);

    });

  });

});

app.get('/topic/:Id', function(req, res) {

  var topicId = req.params.Id;

  sql.connect(config, function (err) {

    if (err) console.log(err);

    var request = new sql.Request();

    request.input("Id", sql.Int, topicId)
    .query('select * from [Topic] where Id=@Id', function (err, set) {

      if (err) console.log(err);
      res.send(set);

    });

  });

});

app.post('/create-topic', function(req, res) {

  var postedBy = req.body.PostedBy;
  var dueDate = req.body.DueDate;
  var title = req.body.Title;
  var description = req.body.Description;
  var date = new Date();

  sql.connect(config, function (err) {

    if (err) console.log(err);

    var request = new sql.Request();

    request
    .input('PostedBy', sql.Int, postedBy)
    .input('DueDate', sql.SmallDateTime, dueDate)
    .input('Title', sql.VarChar, title)
    .input('Description', sql.VarChar, description)
    .input('Date', sql.SmallDateTime, date)
    .query('insert into [Topic] (PostedBy, DueDate, Title, Description, Created, LastUpdate) values (@PostedBy, @DueDate, @Title, @Description, @Date, @Date)', function(err, set) {

      if (err) console.log(err);
      res.send(set);

    });

  });

});

app.post('/update-topic', function(req, res) {

  var id = req.body.Id;
  var postedBy = req.body.PostedBy;
  var dueDate = req.body.DueDate;
  var title = req.body.Title;
  var description = req.body.Description;
  var date = new Date();

  sql.connect(config, function (err) {

    if (err) console.log(err);

    var request = new sql.Request();

    request
    .input('Id', sql.Int, id)
    .input('PostedBy', sql.Int, postedBy)
    .input('DueDate', sql.SmallDateTime, dueDate)
    .input('Title', sql.VarChar, title)
    .input('Description', sql.VarChar, description)
    .input('Date', sql.SmallDateTime, date)
    .query('update [Topic] set PostedBy=@PostedBy, DueDate=@DueDate, Title=@Title, Description=@Description, LastUpdate=@Date where Id=@Id', function(err, set) {

      if (err) console.log(err);
      res.send(set);

    });

  });

});

app.post('/delete-topic', function(req, res) {

  var id = req.body.Id;

  sql.connect(config, function (err) {

    if (err) console.log(err);

    var request = new sql.Request();

    request
    .input('Id', sql.Int, id)
    .query('delete from [Topic] where Id=@Id', function(err, set) {

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
app.get('/user/id/:userId', function(req, res) {

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

// GET User by Email
app.get('/user/email/:email', function(req, res) {

  var email = req.params.email;

  sql.connect(config, function (err) {

    if (err) console.log(err);

    var request = new sql.Request();

    request.input('input', sql.VarChar, email)
    .query('select * from [User] where Email=@input', function (err, set) {

      if (err) console.log(err);
      res.send(set);

    });

  });

});

app.post('/create-user', function(req, res) {

  var email = req.body.Email;
  var firstName = req.body.FirstName;
  var lastName = req.body.LastName;
  var avatar = req.body.Avatar;
  var date = new Date();
  var privacyAccepted = req.body.PrivacyAccepted;

  sql.connect(config, function (err) {

    if (err) console.log(err);

    var request = new sql.Request();

    request
    .input('Email', sql.VarChar, email)
    .input('FirstName', sql.VarChar, firstName)
    .input('LastName', sql.VarChar, lastName)
    .input('Avatar', sql.VarChar, avatar)
    .input('Date', sql.SmallDateTime, date)
    .input('PrivacyAccepted', sql.Int, privacyAccepted)
    .query('insert into [User] (Email, FirstName, LastName, Avatar, Created, LastUpdate, PrivacyAccepted) values (@Email, @FirstName, @LastName, @Avatar, @Date, @Date, @PrivacyAccepted)', function(err, set) {

      if (err) console.log(err);
      res.send(set);

    });

  });

});

app.post('/delete-user', function(req, res) {

  var id = req.body.Id;

  sql.connect(config, function (err) {

    if (err) console.log(err);

    var request = new sql.Request();

    request
    .input('Id', sql.Int, id)
    .query('delete from [User] where Id=@Id', function(err, set) {

      if (err) console.log(err);
      res.send(set);

    });

  });

});

// ------------------------------------- //
//           UserContact Table           //
// ------------------------------------- //


app.get('/contact/:UserId', function(req, res) {

  var id = req.params.UserId;

  sql.connect(config, function (err) {

    if (err) console.log(err);

    var request = new sql.Request();

    request.input("Id", sql.Int, id)
    .query('select * from [UserContact] where UserId=@Id', function (err, set) {

      if (err) console.log(err);
      res.send(set);

    });

  });

});

app.post('/create-contact', function(req, res) {

  var userId = req.body.UserId;
  var contactValue = req.body.ContactValue;
  var contactType = req.body.ContactType;
  var date = new Date();

  sql.connect(config, function (err) {

    if (err) console.log(err);

    var request = new sql.Request();

    request
    .input('UserId', sql.Int, userId)
    .input('ContactValue', sql.VarChar, contactValue)
    .input('ContactType', sql.VarChar, contactType)
    .input('Date', sql.SmallDateTime, date)
    .query('insert into [UserContact] (UserId, ContactValue, ContactType, Created, LastUpdate) values (@UserId, @ContactValue, @ContactType, @Date, @Date)', function(err, set) {

      if (err) console.log(err);
      res.send(set);

    });

  });

});

app.post('/update-contact', function(req, res) {

  var id = req.body.Id;
  var userId = req.body.UserId;
  var contactValue = req.body.ContactValue;
  var contactType = req.body.ContactType;
  var date = new Date();

  sql.connect(config, function (err) {

    if (err) console.log(err);

    var request = new sql.Request();

    request
    .input('Id', sql.Int, id)
    .input('UserId', sql.Int, userId)
    .input('ContactValue', sql.VarChar, contactValue)
    .input('ContactType', sql.VarChar, contactType)
    .input('Date', sql.SmallDateTime, date)
    .query('update [UserContact] set ContactValue=@ContactValue, ContactType=@ContactType where Id=@Id and UserId=@UserId', function(err, set) {

      if (err) console.log(err);
      res.send(set);

    });

  });

});

app.post('/delete-contact', function(req, res) {

  var id = req.body.Id;

  sql.connect(config, function (err) {

    if (err) console.log(err);

    var request = new sql.Request();

    request
    .input('Id', sql.Int, id)
    .query('delete from [UserContact] where Id=@Id', function(err, set) {

      if (err) console.log(err);
      res.send(set);

    });

  });

});

var server = app.listen(process.env.PORT || 3000, function () {
  var port = server.address().port;
  console.log("App live on port", port);
});
