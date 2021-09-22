# MentoringAPI Documentation
Below is detailed information on accessing or posting data to the API, broken up by database table.

If a route is bolded in the sections below, it has been implemented. Italics are planned but not up and running yet. Current web address is **mentorship.cs.wwu.edu**

**PLEASE NOTE**: Database stores times in UTC.

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
**/all-appointments/:Token** - Returns all appointments in table. Provide admin Token.

**/appointment/upcoming/:PairId/:UserId/:Token** - Returns all appointments between specified pair where ScheduledAt is in the future.

**/appointment/past/:PairId/:UserId/:Token** - Returns all appointments between specified pair where ScheduledAt is in the past.

**/appointment/:Id/:UserId/:Token** - Returns appointment matching Id.

### Appointment POST
**/create-appointment** - Provide PairId, ScheduledAt, TopicId, UserId, Token.

**/update-appointment-status** - Provide Id, Status, UserId, Token.

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
**/all-summaries/:Token** - Returns all submitted summaries that are PrivacyAccepted.

**/summary/pair/:PairId/:UserId/:Token** - Returns all summaries written by members of a certain pair.

**/summary/user/:UserId/:Token** - Returns all summaries written by a user.

**/summary/appointment/:AppointmentId/:UserId/:Token** - Returns all summaries for a particular meeting.

### AppointmentSummary POST
**/create-summary** - Provide AppointmentId, SummaryText, UserId, Token.

**/update-summary** - Provide AppointmentId, SummaryText, UserId, Token.

**/delete-summary** - Provide AppointmentId, UserId, Token.

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
**/pair/mentor/:MentorId/:UserId/:Token** - Returns Pair by MentorId.

**/pair/mentee/:MenteeId/:UserId/:Token** - Returns Pair by MenteeId.

**/pair/both/:MentorId/:MenteeId/:UserId/:Token** - Returns pair if exists for these users.

**/pair/:UserId/:Token** - Returns all Pairs that UserId is a part of.

### Pair POST
**/create-pair** - Provide MentorId, MenteeId, admin Token.

**/delete-pair** - Provide Id, admin Token.

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

### Topic GET
**/current-topic/:UserId/:Token** - Returns the topic with ActiveTopic=1.

**/all-topics/:UserId/:Token** - Returns all topics from newest to oldest, except where ActiveTopic=1.

**/topic/:Id/:UserId/:Token** - Returns topic by Id.

### Topic POST
**/create-topic** - Provide PostedBy, DueDate, Title, Description.

**/update-topic** - Provide Id, PostedBy, DueDate, Title, Description, ActiveTopic.

**/delete-topic** - Provide Id.

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

### User GET
**/all-users/:Token** - Provide admin Token.

**/user/id/:UserId/:Token** - Returns user by Id, provide Token.

**/user/access/:LinkedInToken** - Returns user Id, Token by LinkedInToken.

**/user-via-email/:Email/:Token** - Returns user Id by Email, Token.

### User POST
**/create-user** - Provide Token, Email, FirstName, LastName, Avatar, ExpoPushToken, PrivacyAccepted.

*/update-expo-push-token* - Provide Email of user, ExpoPushToken, UserId, Token.

**/update-privacy** - Provide Email, PrivacyAccepted, Token.

**/update-approved** - Provide Email, Approved, UserId, Token.

**/delete-user** - Provide Id, Token.

## UserContact Table
A table containing contact info for users.

### UserContact Structure
* Id (PK, int)
* UserId (int)
* ContactValue (nvarchar(max))
* ContactType (nvarchar(15)) Should be *Email*, *Phone*, or *LinkedIn*.
* Created (smalldatetime)
* LastUpdate (smalldatetime)

### UserContact GET
**/contact/:UserId/:Token** - Returns all contact info for a UserId. Provide existing Token.

### UserContact POST
**/create-contact** - Provide UserId, Token, ContactValue, ContactType.

**/update-contact** - Provide Id, UserId, Token, ContactValue, ContactType.

**/delete-contact** - Provide Id.
