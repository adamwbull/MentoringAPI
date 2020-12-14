# MentoringAPI Documentation
Below is detailed information on accessing or posting data to the API, broken up by database table.

If a route is bolded in the sections below, it has been implemented. Italics are planned but not up and running yet. Current web address is **mshipapp.loca.lt**

**PLEASE NOTE**: Database stores times in UTC.

## Appointment Table
A table containing appointments scheduled between a mentor/mentee pair.

### Appointment Structure
* Id (PK, int)
* PairId (int)
* ScheduledAt (smalldatetime)
* Status (nvarchar(12)) Should be *Pending*, *Scheduled*, *Completed*, or *Cancelled*.
* Created (smalldatetime)
* LastUpdate (smalldatetime)

### Appointment GET
**/all-appointments** - Returns all appointments in table.

**/appointment/:PairId** - Returns all appointments between specified pair.

### Appointment POST
**/create-appointment** - Provide PairId, ScheduledAt.

**/update-appointment-status** - Provide Id, Status.

## AppointmentSummary Table
A table containing summaries written for a particular appointment by a certain user.

### AppointmentSummary Structure
* Id (PK, int)
* AppointmentId (int)
* SummaryText (nvarchar(max))
* UserId (int)
* Status (nvarchar(10)) Should be *Submitted*, or *Edited*.
* PairId (int)
* Created (smalldatetime)
* LastUpdate (smalldatetime)

### AppointmentSummary GET
**/all-summaries** - Returns all submitted summaries that are PrivacyAccepted.

**/summary/pair/:PairId** - Returns all summaries written by members of a certain pair.

**/summary/user/:UserId** - Returns all summaries written by a user.

**/summary/appointment/:AppointmentId** - Returns all summaries for a particular meeting.

### AppointmentSummary POST
**/create-summary** - Provide AppointmentId, SummaryText, UserId, and PairId.

**/update-summary** - Provide AppointmentId, SummaryText, UserId.

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
**/pair/mentor/:MentorId** - Returns Pair by MentorId.

**/pair/mentee/:MenteeId** - Returns Pair by MenteeId.

### Pair POST
**/create-pair** - Provide MentorId, MenteeId.

**/delete-pair** - Provide Id.

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

### Topic GET
**/current-topic** - Returns the most recently created topic.

**/topic/:Id** - Returns topic by Id.

### Topic POST
**/create-topic** - Provide PostedBy, DueDate, Title, Description.

**/update-topic** - Provide Id, PostedBy, DueDate, Title, Description.

**/delete-topic** - Provide Id.

## User Table
A table containing user profile information.

### User Structure
* Id (PK, int)
* Email (nvarchar(255))
* FirstName (nvarchar(30))
* LastName (nvarchar(30))
* Avatar (nvarchar(255))
* Created (smalldatetime)
* LastUpdate (smalldatetime)
* PrivacyAccepted (int, 0/1)

### User GET
**/all-users** - Returns all users in table.

**/user/:Id** - Returns user by Id.

**/user/:Email** - Returns user by Email.

### User POST
**/create-user** - Provide Email, FirstName, LastName, Avatar, PrivacyAccepted.

**/delete-user** - Provide Id.

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
**/contact/:UserId** - Returns all contact info for a UserId.

### UserContact POST
**/create-contact** - Provide UserId, ContactValue, ContactType.

**/update-contact** - Provide Id, UserId, ContactValue, ContactType.

**/delete-contact** - Provide Id.
