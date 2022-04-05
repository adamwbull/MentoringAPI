/*jshint esversion: 8 */
/*
API Dev Server for MentoringApp
To start: node index.js
Localtunnel: lt --port 80* --subdomain mshipapp
* used to be port 3000
*/
var express = require("express");
const fetch = require('node-fetch');
var bodyParser = require("body-parser");
var sql = require("mysql");
var cors = require("cors");
var crypto = require("crypto")
var app = express();
const { Expo } = require("expo-server-sdk");
let expo = new Expo({ accessToken: 'ZVKBleGrwLvwoTIHftrSFjseb9TSpaljblPjMh_q' });
process.env.TZ = 'America/Los_Angeles';

app.use(bodyParser.json());
app.use(cors());

var router = express.Router();

app.use('/api', router);

// SQL configuration.
var config = require('./config.js');

var pool = sql.createPool(config.databaseOptions);

// ------------------------------------- //
//             Notifications             //
// ------------------------------------- //

async function sendMessagesNotification(pushTokens, title, body, sound, data) {
  // Create the messages that you want to send to clients
  let messages = [];
  for (let pushToken of pushTokens) {
    // Each push token looks like ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]

    // Check that all your push tokens appear to be valid Expo push tokens
    if (!Expo.isExpoPushToken(pushToken)) {
      console.error(`Push token ${pushToken} is not a valid Expo push token`);
      continue;
    }

    // Construct a message (see https://docs.expo.io/push-notifications/sending-notifications/)
    messages.push({
      to: pushToken,
      sound: sound,
      title: title,
      body: body,
      data: data,
    })
  }
  let chunks = expo.chunkPushNotifications(messages);
  (async () => {
    // Send the chunks to the Expo push notification service. There are
    // different strategies you could use. A simple one is to send one chunk at a
    // time, which nicely spreads the load out over time:
    for (let chunk of chunks) {
      try {
        let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        console.log(ticketChunk);
        // NOTE: If a ticket contains an error code in ticket.details.error, you
        // must handle it appropriately. The error codes are listed in the Expo
        // documentation:
        // https://docs.expo.io/push-notifications/sending-notifications/#individual-errors
      } catch (error) {
        console.error(error);
      }
    }
  })();

  return true;
}

// ------------------------------------- //
//            Token Securing             //
// ------------------------------------- //

async function authorizeMatch(token, arr, callback) {

  var check = "select Id from User where Token=? and Id=?";
  var auth = -1;

  pool.query(check, [token, arr[0]], function (error, results, fields) {
      if (error) throw error;
      auth = results.length;
      callback(auth);
  });

}

async function authorizeMatchWrapper(token, arr) {
    return new Promise((resolve) => {
        authorizeMatch(token,arr,(callback) => {
            resolve(callback);
        });
    });
}

async function authorizeExists(token, callback) {

  var check = "select Id from Verify where Token=?";
  var auth = -1;

  pool.query(check, [token], function (error, results, fields) {
      if (error) throw error;
      auth = results.length;
      if (auth == 0) {
        pool.query("select Id from User where Token=?", [token], function (error, results, fields) {
            if (error) throw error;
            auth = results.length;
            callback(auth)
        })
      } else {
        callback(auth)
      }
      
  });

}

async function authorizeExistsWrapper(token) {
    return new Promise((resolve) => {
        authorizeExists(token,(callback) => {
            resolve(callback);
        });
    });
}

async function authorizeAdmin(token, callback) {

  var check = "select Id from Admin where Token=?";
  var auth = -1;

  pool.query(check, [token], function (error, results, fields) {
      if (error) throw error;
      auth = results.length;
      callback(auth);
  });

}

async function authorizeAdminWrapper(token) {
    return new Promise((resolve) => {
        authorizeAdmin(token,(callback) => {
            resolve(callback);
        });
    });
}

async function authorizePair(targetId, userId, token, callback) {

  var check = "select * from Pair where (MentorId=? and MenteeId=?) or (MentorId=? and MenteeId=?)";
  var auth = -1;

  pool.query(check, [targetId, userId, targetId, userId], function (error, results, fields) {
      if (error) throw error;
      auth = results.length;
      callback(auth);
  });

  /*
  sql.connect(config, function (err) {

    if (err) console.log(err);

    var request = new sql.Request();
    request
    .input('Token', sql.VarChar, token)
    .input('TargetId', sql.Int, targetId)
    .input('UserId', sql.Int, userId)
    .query('select * from [Pair] as P join [User] as U on P.MentorId=U.Id' +
                  ' where MentorId=@UserId and MenteeId=@TargetId and Token=@Token' +
          ' union' +
          ' select * from [Pair] as P join [User] as U on P.MenteeId=U.Id' +
                  ' where MenteeId=@UserId and MentorId=@TargetId and Token=@Token', function (err, set) {

      if (err) console.log(err);
      console.log("Results: ", set);
      if (set.recordset.length > 0) {
        callback(true);
      } else {
        callback(false);
      }
    });
  });
  */

}

// Checks if user has access to information of another user. (are they paired?)
async function authorizePairWrapper(targetId, userId, token) {
    return new Promise((resolve) => {
        authorizePair(targetId,userId,token,(callback) => {
            resolve(callback);
        });
    });
}

// q = query, a = query params
async function execute_async (q, a) {
  return await new Promise(function(resolve,reject){
    pool.query(
      q,
      a,
      function (error, results, fields) {
        if (error) {
          reject(error);
        } else {
          resolve(results)
        }
      })
  })
}

// ------------------------------------- //
//             Admin Table               //
// ------------------------------------- //

app.post('/admin/verify-login', async function(req, res) {

  var email = req.body.Email
  var password = req.body.Password
  var token = req.body.Token

  var check = await authorizeExistsWrapper(token);

  if (check) {

    var data = await execute_async('select Id, Email, FirstName, LastName, Token from Admin where Email=? and Password=?', [email, password])

    if (data.length > 0) {
      res.send({success:true,Admin:data[0]})
    } else {
      res.send({success:false,errorCode:2})
    }

  } else {

   res.send({success:false,errorCode:1})

  }

});

app.post('/admin/mark-users-for-deletion', async function(req, res) {

  var password = req.body.Password
  var token = req.body.Token
  var ids = req.body.Ids
  var check = await execute_async('select Id from Admin where Password=? and Token=?', [password, token])

  if (check.length > 0) {

    var arr = []
    for (var i = 0; i < ids.length; i++) {
      var del = await execute_async('update User set Type=2, LastUpdate=current_timestamp where Id=?', [ids[i]])
      arr.push(del)
    }

    res.send({success:true,result:arr})

  } else {

   res.send({success:false,errorCode:1})

  }

});

app.post('/admin/unmark-users-for-deletion', async function(req, res) {

  var password = req.body.Password
  var token = req.body.Token
  var ids = req.body.Ids
  var check = await execute_async('select Id from Admin where Password=? and Token=?', [password, token])

  if (check.length > 0) {

    var arr = []
    for (var i = 0; i < ids.length; i++) {
      var del = await execute_async('update User set Type=0, LastUpdate=current_timestamp  where Id=?', [ids[i]])
      arr.push(del)
    }

    res.send({success:true,result:arr})

  } else {

   res.send({success:false,errorCode:1})

  }

});

app.post('/admin/update-password', async function(req, res) {

  var password = req.body.Password
  var token = req.body.Token
  var oldPassword = req.body.OldPassword
  var check = await execute_async('select Id from Admin where Password=? and Token=?', [oldPassword, token])

  if (check.length > 0) {

    var updated = await execute_async('update Admin set Password=? where Id=?', [password, check[0]])

    res.send({success:true,result:updated})

  } else {

   res.send({success:false,errorCode:1})

  }

});

// ------------------------------------- //
//          Appointment Table            //
// ------------------------------------- //

// GET all Appointments
app.get('/all-appointments/:Token', async function (req, res) {

  var token = req.params.Token;

  var check = await authorizeAdminWrapper(token);

  if (check) {

    var data = await execute_async('select * from Appointment', [])
    res.send(data)

  } else {
    res.send({success:false});
  }

});

// GET Appointment by PairId
app.get('/appointment/upcoming/:PairId/:UserId/:Token', async function(req, res) {

  var pairId = req.params.PairId;
  var token = req.params.Token;
  var userId = req.params.UserId;
  var date = new Date();

  if (pairId == undefined || userId == undefined || token == undefined) {
    res.send({success:false, undefinedValues:true})
  }

  var check = await authorizeMatchWrapper(userId, token);

  if (check) {

    var data = await execute_async('select * from Appointment where PairId=? and ScheduledAt>=?', [pairId, date])
    res.send(data)

  } else {
    res.send({success:false});
  }

});

app.get('/appointment/past/:PairId/:UserId/:Token', async function(req, res) {

  var pairId = req.params.PairId;
  var userId = req.params.UserId;
  var token = req.params.Token;
  var date = new Date();

  if (pairId == undefined || userId == undefined || token == undefined) {
    res.send({success:false, undefinedValues:true})
  }

  var check = await authorizeMatchWrapper(userId, token);

  if (check) {

    var data = await execute_async('select * from Appointment where PairId=? and ScheduledAt<=?', [pairId, date])
    res.send(data)

  } else {
    res.send({success:false});
  }

});

app.get('/appointment/:Id/:UserId/:Token', async function(req, res) {

  var id = req.params.Id;
  var userId = req.params.UserId;
  var token = req.params.Token;

  var check = await authorizeMatchWrapper(userId, token);

  if (check) {

    var data = await execute_async('select * from Appointment where Id=?', [id])
    res.send(data)

  } else {
    res.send({success:false});
  }

});

// POST create appointment (provide PairId, ScheduledAt)
app.post('/create-appointment', async function(req, res) {

  var pairId = req.body.PairId;
  var userId = req.body.UserId;
  var token = req.body.Token;
  var scheduledAt = req.body.ScheduledAt;
  var date = new Date();
  var topicId = req.body.TopicId;

  var check = await authorizeMatchWrapper(userId, token);

  if (check) {

    var pairData = await execute_async('select MentorId from Pair where MenteeId=? and Id=?', [userId, pairId])
    var mentorId = pairData[0].MentorId

    var mentorData = await execute_async('select ExpoPushToken from User where Id=?', [mentorId])
    var expoPushToken = mentorData[0].ExpoPushToken

    // Send message notification.
    var pushTokens = [expoPushToken];
    sendMessagesNotification(pushTokens, 'New Appointment', 'Your mentee proposed a new appointment!', true, {Screen:'MeetingsScreen'})

    // Create meeting.
    var insert = await execute_async('insert into Appointment set ?', {PairId:pairId, ScheduledAt:scheduledAt, Status:'Pending',Created:date,LastUpdate:date,TopicId:topicId})
    res.send(insert)

  } else {
    res.send({success:false});
  }

});

app.post('/update-appointment-status', async function(req, res) {

  var status = req.body.Status;
  var id = req.body.Id;
  var userId = req.body.UserId;
  var token = req.body.Token;

  var check = await authorizeMatchWrapper(userId, token);

  if (check) {

    var update = await execute_async('update Appointment set Status=? where Id=?', [status, id])
    res.send(update)

  } else {

    res.send({success:false});

  }

});

// ------------------------------------- //
//        AppointmentSummary Table       //
// ------------------------------------- //

app.get('/all-summaries/:Token', async function(req, res) {

  var token = req.params.Token;

  var check = await authorizeAdminWrapper(token);

  if (check) {

    var data = await execute_async('select * from AppointmentSummary as S where S.AppointmentId in (select A.Id from Appointment as A where A.PairId in (select Id from Pair as P where P.PrivacyAccepted = 1)) order by S.Created desc', [])
    res.send(data)

  } else {

    res.send({success:false});

  }

});

app.get('/summary/pair/:PairId/:UserId/:Token', async function(req, res) {

  var pairId = req.params.PairId;
  var userId = req.params.UserId;
  var token = req.params.Token;

  var check = await authorizeMatchWrapper(userId, token);

  if (check) {

    var data = await execute_async('select * from AppointmentSummary where PairId=?', pairId)
    res.send(data)

  } else {

    res.send({success:false});

  }


});

app.get('/summary/user/:UserId/:Token', async function(req, res) {

  var userId = req.params.UserId;
  var token = req.params.Token;

  var check = await authorizeMatchWrapper(userId, token);

  if (check) {

    var data = await execute_async('select * from AppointmentSummary where UserId=?', [userId])
    res.send(data)

  } else {

    res.send({success:false});

  }

});

app.get('/summary/appointment/:AppointmentId/:UserId/:Token', async function(req, res) {

  var appointmentId = req.params.AppointmentId;
  var userId = req.params.UserId;
  var token = req.params.Token;

  var check = await authorizeMatchWrapper(userId, token);

  if (check) {

    var data = await execute_async('select * from AppointmentSummary where AppointmentId=?', [appointmentId])
    res.send(data)

  } else {

    res.send({success:false});

  }

});

app.post('/create-summary', async function(req, res) {

  var appointmentId = req.body.AppointmentId;
  var summaryText = req.body.SummaryText;
  var userId = req.body.UserId;
  var token = req.body.Token;
  var date = new Date();

  var check = await authorizeMatchWrapper(userId, token);

  if (check) {

    var insert = await execute_async('insert into AppointmentSummary set ?', {AppointmentId:appointmentId, SummaryText:summaryText, UserId:userId, Status:'Submitted', Created:date, LastUpdate:date})
    res.send(insert)

  } else {

    res.send({success:false});

  }

});

app.post('/update-summary', async function(req, res) {

  var appointmentId = req.body.AppointmentId;
  var summaryText = req.body.SummaryText;
  var userId = req.body.UserId;
  var token = req.body.Token;
  var date = new Date();

  var check = await authorizeMatchWrapper(userId, token);

  if (check) {

    var update = await execute_async('update AppointmentSummary set SummaryText=?, LastUpdate=?, Status=? where AppointmentId=? and UserId=?', [summaryText, date, 'Edited', appointmentId, userId])
    res.send(update)

  } else {

    res.send({success:false});

  }

});

// ------------------------------------- //
//              Pair Table               //
// ------------------------------------- //

app.get('/admin/all-pairs/:Token', async function(req, res) {

  var id = req.params.UserId;
  var token = req.params.Token;

  var check = await authorizeAdminWrapper(token);

  if (check) {
    //var d = await execute_async('select * from User where Type=0 or Type=2', [])
    var d = await execute_async('select * from Pair', [])
    var data = []

    for (var item of d) {
      item.MentorName = await execute_async('select FirstName, LastName from User where Id=?', [item.MentorId])
      item.MenteeName = await execute_async('select FirstName, LastName from User where Id=?', [item.MenteeId])
      data.push(item)
    }

    res.send(data)
    // var data = await execute_async('select * from Pair', [])
    // res.send(data)

  } else {

    res.send({success:false});

  }

});

app.get('/pair/:UserId/:Token', async function(req, res) {

  var id = req.params.UserId;
  var token = req.params.Token;

  var check = await authorizeMatchWrapper(id, token);

  if (check) {

    var data = await execute_async('select * from Pair where MentorId=? or MenteeId=?', [id, id])
    res.send(data)

  } else {

    res.send({success:false});

  }

});

app.get('/pair/both/:MentorId/:MenteeId/:UserId/:Token', async function(req, res) {

  var mentorId = req.params.MentorId;
  var menteeId = req.params.MenteeId;
  var userId = req.params.UserId;
  var token = req.params.Token;

  var check = await authorizeMatchWrapper(userId, token);

  if (check) {

    var data = await execute_async('select * from Pair where MentorId=? and MenteeId=?', [mentorId, menteeId])
    res.send(data)

  } else {

    res.send({success:false});

  }

});

app.get('/pair/mentor/:MentorId/:UserId/:Token', async function(req, res) {

  var mentorId = req.params.MentorId;
  var userId = req.params.UserId;
  var token = req.params.Token;

  var check = await authorizeMatchWrapper(userId, token);

  if (check) {

    var data = await execute_async('select * from Pair where MentorId=?', [mentorId])
    res.send(data)

  } else {

    res.send({success:false});

  }

});

app.get('/pair/mentee/:MenteeId/:UserId/:Token', async function(req, res) {

  var menteeId = req.params.MenteeId;
  var userId = req.params.UserId;
  var token = req.params.Token;

  var check = await authorizeMatchWrapper(userId, token);

  if (check) {

    var data = await execute_async('select * from Pair where MenteeId=?', [menteeId])
    res.send(data)

  } else {

    res.send({success:false});

  }

});

app.post('/create-pair', async function(req, res) {

  var mentorId = req.body.MentorId;
  var menteeId = req.body.MenteeId;
  var token = req.body.Token;
  var date = new Date();
  var privacyAccepted = 0;
  var mentorPrivacyAccepted = 0;
  var menteePrivacyAccepted = 0;

  var check = await authorizeAdminWrapper(token);

  if (check) {

    var mentorPrivacy = await execute_async('select PrivacyAccepted from User where Id=?', [mentorId])
    var mentorPrivacyAccepted = mentorPrivacy[0].PrivacyAccepted

    var menteePrivacy = await execute_async('select PrivacyAccepted from User where Id=?', [menteeId])
    var menteePrivacyAccepted = menteePrivacy[0].PrivacyAccepted

    if (menteePrivacyAccepted == 1 && mentorPrivacyAccepted == 1) {
      privacyAccepted = 1;
    }

    var insert = await execute_async('insert into Pair set ?', {MentorId:mentorId, MenteeId:menteeId, Created:date, LastUpdate:date, PrivacyAccepted:privacyAccepted})
    res.send(insert)

  } else {

    res.send({success:false});

  }

});

app.post('/delete-pair', async function(req, res) {

  var password = req.body.Password
  var token = req.body.Token
  var ids = req.body.Ids
  var check = await execute_async('select Id from Admin where Password=? and Token=?', [password, token])

  if (check.length > 0) {

    var arr = []
    for (var i = 0; i < ids.length; i++) {
      var del = await execute_async('update Pair set Type=2, LastUpdate=current_timestamp where Id=?', [ids[i]])
      arr.push(del)
    }

    res.send({success:true,result:arr})

  } else {

   res.send({success:false,errorCode:1})

  }

});

app.post('/undelete-pair', async function(req, res) {

  var password = req.body.Password
  var token = req.body.Token
  var ids = req.body.Ids
  var check = await execute_async('select Id from Admin where Password=? and Token=?', [password, token])

  if (check.length > 0) {

    var arr = []
    for (var i = 0; i < ids.length; i++) {
      var del = await execute_async('update Pair set Type=0, LastUpdate=current_timestamp where Id=?', [ids[i]])
      arr.push(del)
    }

    res.send({success:true,result:arr})

  } else {

   res.send({success:false,errorCode:1})

  }

});

// app.post('/delete-pair', async function(req, res) {

//   var id = req.body.Id;
//   var token = req.body.Token;

//   var check = await authorizeAdminWrapper(token);

//   if (check) {

//     var deleted = await execute_async('delete from Pair where Id=?', [id])
//     res.send(deleted)

//   } else {

//     res.send({success:false});

//   }

// });

// ------------------------------------- //
//             Topic Table               //
// ------------------------------------- //

app.get('/current-topic/:UserId/:Token', async function(req, res) {

  var userId = req.params.UserId;
  var token = req.params.Token;

  var check = await authorizeMatchWrapper(userId, token);

  if (check) {

    var data = await execute_async('select * from Topic where ActiveTopic=1', [])
    res.send(data)

  } else {
    res.send({success:false});
  }

});

app.get('/all-topics/:UserId/:Token', async function(req, res) {

  var userId = req.params.UserId;
  var token = req.params.Token;

  var check = await authorizeMatchWrapper(userId, token);

  if (check) {

    var data = await execute_async('select * from Topic where ActiveTopic=0 order by Created DESC', [])
    res.send(data)

  } else {

    res.send({success:false});

  }

});

app.get('/admin/all-topics/:Token', async function(req, res) {

  var token = req.params.Token;

  var check = await authorizeAdminWrapper(token);

  if (check) {

    var data = await execute_async('select * from Topic order by LastUpdate DESC', [])
    res.send(data)

  } else {

    res.send({success:false});

  }

});

app.get('/topic/:Id/:UserId/:Token', async function(req, res) {

  var topicId = req.params.Id;
  var userId = req.params.UserId;
  var token = req.params.Token;

  var check = await authorizeMatchWrapper(userId, token);

  if (check) {

    var data = await execute_async('select * from Topic where Id=?', [topicId])
    res.send(data)

  } else {

    res.send({success:false});

  }

});

app.post('/create-topic', async function(req, res) {

  var postedBy = req.body.PostedBy;
  var dueDate = req.body.DueDate;
  var title = req.body.Title;
  var description = req.body.Description;
  var token = req.body.Token;
  var date = new Date();
  var archived = req.body.Archived;
  var activeTopic = req.body.ActiveTopic;
  var notifyUsers = req.body.NotifyUsers;

  var check = await authorizeAdminWrapper(token);
  if (check) {

    // Update other ActiveTopic to set it as disabled if necessary.
    if (activeTopic == 1) {
      var upd = await execute_async('update Topic set ActiveTopic=0 where ActiveTopic=1;', [])
    }

    // create topic.
    var insert = await execute_async('insert into Topic set ?', {Archived:archived, ActiveTopic:activeTopic, PostedBy:postedBy, DueDate:dueDate, Title:title, Description:description, Created:date, LastUpdate:date})

    if (notifyUsers) {
      // Notify users.
      var userTokens = await execute_async('select ExpoPushToken from User where Type=0', [])
      var pushTokens = []
      for (var i=0; i<userTokens.length; i++) {
        pushTokens.push(userTokens[i].ExpoPushToken)
      }

      sendMessagesNotification(pushTokens, 'New Topic', 'CS/M has posted a topic!', true, {Screen:'TopicsScreen'})
    }

    res.send({success:true})

  } else {

    res.send({success:false});

  }

});

app.post('/update-topic', async function(req, res) {

  var id = req.body.Id;
  var postedBy = req.body.PostedBy;
  var dueDate = req.body.DueDate;
  var title = req.body.Title;
  var description = req.body.Description;
  var activeTopic = req.body.ActiveTopic;
  var archived = req.body.Archived;
  var token = req.body.Token;
  var notifyUsers = req.body.NotifyUsers;
  var date = new Date();

  var check = await authorizeAdminWrapper(token);

  if (check) {

    // Update other ActiveTopic to set it as disabled if necessary.
    if (activeTopic == 1) {
      var upd = await execute_async('update Topic set ActiveTopic=0 where ActiveTopic=1;', [])
    }

    var update = await execute_async('update Topic set PostedBy=?, DueDate=?, Title=?, Description=?, LastUpdate=?, ActiveTopic=?, Archived=? where Id=?', [postedBy, dueDate, title, description, date, activeTopic, archived, id])

    if (notifyUsers) {
      // Notify users.
      var userTokens = await execute_async('select ExpoPushToken from User where Type=0', [])
      var pushTokens = []
      for (var i=0; i<userTokens.length; i++) {
        pushTokens.push(userTokens[i].ExpoPushToken)
      }

      sendMessagesNotification(pushTokens, 'New Topic', 'CS/M has posted a topic!', true, {Screen:'TopicsScreen'})
    }

    res.send({success:true})

  } else {

    res.send({success:false});

  }

});

app.post('/delete-topic', async function(req, res) {

  var id = req.body.Id;
  var token = req.body.Token;

  var check = await authorizeAdminWrapper(token);

  if (check) {

    var deleted = await execute_async('delete from Topic where Id=?', [id])
    res.send(deleted)

  } else {

    res.send({success:false});

  }

});



// ------------------------------------- //
//              User Table               //
// ------------------------------------- //



// GET all Users
app.get('/all-users/:Token', async function (req, res) {

  var token = req.params.Token;
  var check = await authorizeAdminWrapper(token);

  if (check) {

    var d = await execute_async('select * from User where Type=0 or Type=2', [])
    var data = []

    for (var item of d) {
      item.Summaries = await execute_async('select * from AppointmentSummary where UserId=?', [item.Id])
      item.MentorPairs = await execute_async('select * from Pair where MentorId=?', [item.Id])
      item.MenteePairs = await execute_async('select * from Pair where MenteeId=?', [item.Id])
      data.push(item)
    }

    res.send(data)

  } else {

    res.send({success:false});

  }

});

// GET User by Id
app.get('/user/id/:UserId/:Token', async function(req, res) {

  var userId = req.params.UserId;
  var token = req.params.Token;

  var check = await authorizeMatchWrapper(userId, token);

  if (check) {

    var data = await execute_async('select * from User where Id=?', [userId])
    res.send(data)

  } else {

    res.send({success:false})
  }
});

async function fetchUsing(url, bearer, ender='') {
  var resp;
  if (!bearer) {
    resp = await fetch(url + ender, {
      method: 'GET'
    });
  } else {
    resp = await fetch(url + ender, {
      method: 'GET',
      headers: {
        Authorization: 'Bearer ' + bearer,
      }
    });
  }
  const payload = await resp.json();
  return payload;
}

// GET User Id & Token Using LinkedInToken
app.get('/user/access/:LinkedInToken', async function (req, res)
{
  var linkedInToken = req.params.LinkedInToken;

  console.log(linkedInToken);

  //get email address from LinkedIn
  // const emailres = await fetch('https://api.linkedin.com/v2/clientAwareMemberHandles?q=members&projection=(elements*(primary,type,handle~))', {
  //   method: 'GET',
  //   headers: {
  //     Authorization: 'Bearer ' + linkedInToken,
  //   }
  // });
  // const emailPayload = await emailres.json();
  const emailPayload = await fetchUsing('https://api.linkedin.com/v2/clientAwareMemberHandles?q=members&projection=(elements*(primary,type,handle~))', linkedInToken);

  console.log(emailPayload);
  var email = emailPayload.elements[0]["handle~"].emailAddress;
  if (email) {
    if (await execute_async('select Id from User where Email=?', [email]).length > 0) {
      console.log("User does not exist");
      initializeNewUser(email);
    }
    if (await execute_async('select Token from User where Email=?', [email]) > 0) {
      var newToken = crypto.createHash('sha256').update(tokenComponent + new Date().toString()).digest('hex');
      await execute_async('update User set Token=? where Email=?', [newToken, email]);
    }
    console.log("Token should exist...", data);
    var data = await execute_async('select Id,Token from User where Email=?', [email]);
    res.send(data);
  } else {
    console.log("No valid email...");
    res.send({success:false});
  }
});

// GET Other User by Id, UserId, Token
app.get('/user/other/:TargetId/:UserId/:Token', async function (req, res) {

  var targetId = req.params.TargetId;
  var userId = req.params.UserId;
  var token = req.params.Token;

  var check = await authorizePairWrapper(targetId, userId, token);

  if (check) {

    var data = await execute_async('select FirstName,LastName,Email,Avatar,Id from User where Id=?', [targetId])
    res.send(data)

  } else {

    res.send({success:false})

  }

});

// GET User by Email
app.get('/user-via-email/:Email/:Token', async function(req, res) {

  var email = req.params.Email;
  var token = req.params.Token;

  var check = await authorizeExistsWrapper(token);

  if (check) {

    var data = await execute_async('select Id from User where Email=?', [email])
    res.send(data)

  } else {

    res.send({success:false});

  }

});

async function initializeNewUser(email) {
  var date = new Date()
  var filler = "NEW" + date.toString();
  var components = {
    Email:        email,
    FirstName:    filler,
    LastName:     filler,
  }
  await execute_async('insert into User set ?', components);
}

app.post('/create-user', async function(req, res) {

  var date = new Date();
  var components = {
    Email:            req.body.Email,
    FirstName:        req.body.FirstName,
    LastName:         req.body.LastName,
    Avatar:           req.body.Avatar,
    ExpoPushToken:    req.body.ExpoPushToken,
    Created:          date,
    LastUpdate:       date,
    PrivacyAccepted:  req.body.PrivacyAccepted
  };
  var token = req.body.Token;

  var check = await authorizeExistsWrapper(token);
  if (check) {
    if (await execute_async('select Email from User where Email=?', [components.Email]).length > 0) {
      var update = await execute_async('update User set ? where Email=?', [components, components.Email]);
      res.send(update);
    } else {
      var create = await execute_async('insert into User set ?', components);
      res.send(create);
    }
  } else {
    res.send({success:false});
  }

});

app.post('/update-privacy', async function(req, res) {

  var email = req.body.Email;
  var privacyAccepted = req.body.PrivacyAccepted;
  var userId = req.body.UserId;
  var token = req.body.Token;

  var check = await authorizeMatchWrapper(userId, token);

  if (check) {

    var update = await execute_async('update User set PrivacyAccepted=? where Email=?', [privacyAccepted, email])
    res.send(update)

  } else {

    res.send({success:false});

  }

});

app.post('/update-expo-push-token', async function(req, res) {

  var email = req.body.Email;
  var expoPushToken = req.body.ExpoPushToken;
  var userId = req.body.UserId;
  var token = req.body.Token;

  var check = await authorizeMatchWrapper(userId, token);

  if (check) {

    var update = await execute_async('update User set ExpoPushToken=? where Email=?', [expoPushToken, email])
    res.send(update)

  } else {

    res.send({success:false});

  }

});

app.post('/update-approved', async function(req, res) {

  var email = req.body.Email;
  var approved = req.body.Approved;
  var token = req.body.Token;
  var userId = req.body.UserId;
  var check = await authorizeMatchWrapper(userId, token);

  if (check) {

    var update = await execute_async('update User set Approved=? where Email=?', [approved, email])
    res.send(update)

  } else {

    res.send({success:false});

  }

});

app.post('/delete-user', async function(req, res) {

  var id = req.body.Id;
  var token = req.body.Token;

  var check = await authorizeAdminWrapper(token);

  if (check) {

    var deleted = await execute_async('delete from User where Id=?', [id])

  } else {

    res.send({success:false});

  }

});

// Server exposed on port 3000.
var server = app.listen(process.env.PORT || 3000, function () {
  var port = server.address().port;
  console.log("App live on port", port);
});
