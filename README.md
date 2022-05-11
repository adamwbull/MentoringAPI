# Use Cases
Small guides for how to accomplish certain tasks.

## Journey Map
Blue is administrative dashboard, green is user mobile application.
![Customer Journey Map](https://github.com/cappycap/MentoringAPI/blob/main/cjm.png?raw=true)

## Reset user password using MYSQL.
Using this guide you can update a password through the Ubuntu box.
1. Connect to WWU-Secure or using Cisco AnyConnect VPN.
2. Follow traditional CSCI guide to get onto a linux machine. 
3. Connect to the mentors box with a sudo user (currently 172.30.142.72:922 as of this writing)
4. Type `sudo mysql -u root` to start mysql.
5. Type `use mentors;` to switch to the mentors table.
6. Check out `select * from Admin;` and you will see admins have sha256 passwords.
7. Generate a sha string for a given password on a site like https://emn178.github.io/online-tools/sha256.html. 
8. Run the following command for the Admin you'd like to update the password for: `update Admin set Password='<sha256>' where Id=?;`

# PM2 Daemon Management
The API is ran using PM2 globally on the box. Here are some commands you can run as a user:
1. `sudo PM2_HOME=/etc/pm2daemon pm2 status` - View all running processes.
2. `sudo PM2_HOME=/etc/pm2daemon pm2 restart index` - Restart the API node process.

You can read more on the PM2 Guide site: https://pm2.keymetrics.io/docs/usage/quick-start/

What's important is you preface the command with `sudo PM2_HOME=/etc/pm2daemon` to manage PM2 from a global perspective. Otherwise, you will be managing PM2 processed from a user perspective.

# Rebuilding the API
Set up this bash file in your home directory:
```
cd /var/www/mentorsapp.cs.wwu.edu/api
git stash
git pull
sudo PM2_HOME=/etc/pm2daemon pm2 restart index
cd ~
```

# Building the Dashboard Website
1. Clone the repo in a local directory on the mentors server: https://github.com/cappycap/MentoringDashboard
2. Set up this bash file in your home directory:
```
sudo rm -r /var/www/mentorsapp.cs.wwu.edu/dash
sudo mkdir /var/www/mentorsapp.cs.wwu.edu/dash
cd MentoringDashboard
git pull https://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@github.com/cappycap/MentoringDashboard.git
expo build:web
cd web-build
sudo cp -r . /var/www/mentorsapp.cs.wwu.edu/dash
cd ~
```

## Deleting pairs using MYSQL.
Can single delete or batch delete pairs as needed
All pairs that are marked for deletion will have a type value of 2.
1. Connect to WWU-Secure or using Cisco AnyConnect VPN.
2. Follow traditional CSCI guide to get onto a linux machine. 
3. Connect to the mentors box with a sudo user (currently 172.30.142.72:922 as of this writing)
4. Type `sudo mysql -u root` to start mysql.
5. Type `use mentors;` to switch to the mentors table.
6A) Delete all pairs that are marked for deletion: `delete * from Pair where Type=2;`
6B) List all pairs that are marked for deletion: `select * from Pair where Type=2;`
7B) Delete a specific pair, obtain the deletion target's Id then: `delete from Pair where Id='?';`

# MentoringAPI Documentation
Below is detailed information on accessing or posting data to the API, broken up by database table.

If a route is bolded in the sections below, it has been implemented. Italics are planned but not up and running yet. Current web address is *mentorship.cs.wwu.edu*

*PLEASE NOTE*: Database stores times in UTC.

*PLEASE NOTE*: Endpoints with "admin" in the URL or description will require a token or token/id pair from the Admin table.

## Verify Table
A table containing keys used to make API calls.

### Verify Structure
* Id (PK, int)
* Token (nvarchar(MAX))

## Admin Table
A table containing admin users that can access the dashboard.

### Admin Structure
* Id (PK, int)
* Email (nvarchar(MAX))
* Password (nvarchar(MAX))
* FirstName (nvarchar(MAX))
* LastName (nvarchar(MAX))
* Token (nvarchar(MAX))

### Admin GET

### Admin POST
*/admin/verify-login* - Provide Email, Password, Token.

*/admin/update-password* - Provide OldPassword, Password, Token.

*/admin/mark-users-for-deletion* - Provide Ids Array (For Users), Token, Password (for Admin).

*/admin/unmark-users-for-deletion* - Provide Ids Array (For Users), Token, Password (for Admin).

## Appointment Table
A table containing appointments scheduled between a mentor/mentee pair.

### Appointment Structure
* Id (PK, int)
* PairId (int)
* TopicId (int) *current topic when appointment was proposed*
* ScheduledAt (smalldatetime)
* Status (nvarchar(12)) Should be *Pending*, *Scheduled*, *Done*, *Completed*, or *Cancelled*.
* Created (smalldatetime)
* LastUpdate (smalldatetime)

### Appointment GET
*/all-appointments/:Token* - Returns all appointments in table. Provide admin Token.

*/appointment/upcoming/:PairId/:UserId/:Token* - Returns all appointments between specified pair where ScheduledAt is in the future.

*/appointment/past/:PairId/:UserId/:Token* - Returns all appointments between specified pair where ScheduledAt is in the past.

*/appointment/:Id/:UserId/:Token* - Returns appointment matching Id.

### Appointment POST
*/create-appointment* - Provide PairId, ScheduledAt, TopicId, UserId, Token.

*/update-appointment-status* - Provide Id, Status, UserId, Token.

## AppointmentSummary Table
A table containing summaries written for a particular appointment by a certain user.

### AppointmentSummary Structure
* Id (PK, int)
* AppointmentId (int)
* SummaryText (nvarchar(max))
* UserId (int)
* Status (nvarchar(10)) Should be *Submitted*, or *Edited*.
* Created (smalldatetime)
* LastUpdate (smalldatetime)

### AppointmentSummary GET
*/all-summaries/:Token* - Returns all submitted summaries that are PrivacyAccepted. Proide admin token.

*/summary/pair/:PairId/:UserId/:Token* - Returns all summaries written by members of a certain pair.

*/summary/user/:UserId/:Token* - Returns all summaries written by a user.

*/summary/appointment/:AppointmentId/:UserId/:Token* - Returns all summaries for a particular meeting.

### AppointmentSummary POST
*/create-summary* - Provide AppointmentId, SummaryText, UserId, Token.

*/update-summary* - Provide AppointmentId, SummaryText, UserId, Token.

*/delete-summary* - Provide AppointmentId, UserId, Token.

## Pair Table
A table containing mentor/mentee pairs.

### Pair Structure
* Id (PK, int)
* MentorId (int)
* MenteeId (int)
* Created (smalldatetime)
* LastUpdate (smalldatetime)
* PrivacyAccepted (int, 0/1)

### Pair GET
*/admin/all-pairs/:Token* - Returns all pairs. Provide admin token. 

*/pair/mentor/:MentorId/:UserId/:Token* - Returns Pair by MentorId.

*/pair/mentee/:MenteeId/:UserId/:Token* - Returns Pair by MenteeId.

*/pair/both/:MentorId/:MenteeId/:UserId/:Token* - Returns pair if exists for these users.

*/pair/:UserId/:Token* - Returns all Pairs that UserId is a part of.

### Pair POST
*/create-pair* - Provide MentorId, MenteeId, admin Token.

*/delete-pair* - Provide Id, admin Token.

## Topic Table
A table containing topics for meeting discussions.

### Topic Structure
* Id (PK, int)
* PostedBy (int)
* DueDate (smalldatetime)
* Title (nvarchar(max))
* Description (nvarchar(max))
* Created (smalldatetime)
* LastUpdate (smalldatetime)
* ActiveTopic (int)
* Archived (int)

### Topic GET
*/current-topic/:UserId/:Token* - Returns the topic with ActiveTopic=1.

*/all-topics/:UserId/:Token* - Returns all topics from newest to oldest, except where ActiveTopic=1.

*/admin/all-topics/:Token* - Returns all topics from newest to oldest.

*/topic/:Id/:UserId/:Token* - Returns topic by Id.

### Topic POST
*/create-topic* - Provide PostedBy, DueDate, Title, Description.

*/update-topic* - Provide Id, PostedBy, DueDate, Title, Description, ActiveTopic.

*/delete-topic* - Provide Id.

## User Table
A table containing user profile information.

### User Structure
* Id (PK, int)
* Token (nvarchar(64))
* Email (nvarchar(255))
* FirstName (nvarchar(30))
* LastName (nvarchar(30))
* Avatar (nvarchar(255))
* ExpoPushToken (nvcarchar(max))
* Created (smalldatetime)
* LastUpdate (smalldatetime)
* PrivacyAccepted (int, 0/1)
* Approved (int, 0/1)
* Type (int, 0=normal user/1=api account/2=primed for deletion)

### User GET
*/all-users/:Token* - Provide admin Token.

*/user/id/:UserId/:Token* - Returns user by Id, provide Token.

*/user/access/:LinkedInToken* - Returns user Id, Token by LinkedInToken.

*/user/other/:TargetId/:UserId/:Token* - Returns valid paired user's FirstName, LastName, Email, Avatar, and Id by TargetId and UserId, provide Token.

*/user-via-email/:Email/:Token* - Returns user Id by Email, Token.

### User POST
*/create-user* - Provide Token, Email, FirstName, LastName, Avatar, ExpoPushToken, PrivacyAccepted.

*/update-expo-push-token* - Provide Email of user, ExpoPushToken, UserId, Token.

*/update-privacy* - Provide Email, PrivacyAccepted, Token.

*/update-approved* - Provide Email, Approved, UserId, Token.

*/mark-user-for-deletion* - Provide Id, Token.
