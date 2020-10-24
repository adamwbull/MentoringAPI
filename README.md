# MentoringAPI Documentation
Below is detailed information on accessing or posting data to the API, broken up by database table.
If a route is bolded in the section, it has been implemented. Italics are planned but not working yet.

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
*/all-appointments* - Returns all appointments in table.

**/appointment/:PairId** - Returns all appointments between specified pair.

### Appointment POST
*/create-appointment* - Provide PairId, ScheduledAt.

*/update-appointment-status* - Update Status with acceptable parameter.

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
*/summary/user/:UserId* - Returns all summaries written by a user.

*/summary/appointment/:AppointmentId* - Returns all summaries for a particular meeting.

### AppointmentSummary POST
*/create-summary* - Provide AppointmentId, SummaryText, UserId.

*/update-summary* - Provide AppointmentId, SummaryText, UserId.

## Pair Table
A table containing mentor/mentee pairs.

### Pair Structure
* Id (PK, int)
* MentorId (int)
* MenteeId (int)
* Created (smalldatetime)
* LastUpdate (smalldatetime)

### Pair GET
*/pair/mentor/:MentorId* - Returns Pair by MentorId.

*/pair/mentee/:MenteeId* - Returns Pair by MenteeId.

### Pair POST
*/create-pair* - Provide MentorId, MenteeId.

*/delete-pair* - Provide MentorId, MenteeId.

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
*/current-topic* - Returns the most recently created topic.

*/topic/:Id* - Returns topic by Id.

### Topic POST
*/create-topic* - Provide PostedBy, DueDate, Title, Description.

## User Table
A table containing user profile information.

### User Structure
* Id (PK, int)
* Email (nvarchar(256))
* FirstName (nvarchar(30))
* LastName (nvarchar(30))
* Created (smalldatetime)
* LastUpdate (smalldatetime)

### User GET
**/all-users** - Returns all users in table.
**/user/:Id** - Returns user by Id.

### User POST
*/create-user* - Provide Email, FirstName, LastName.

*/delete-user* - Provide Id, Email.

## UserContact Table
A table containing contact info for users.

### UserContact Structure
* Id (PK, int)
* UserId (int)
* ContactValue (nvarchar(max))
* ContactType (nvarchar(15)) Should be *Email* or *Phone*.
* Created (smalldatetime)
* LastUpdate (smalldatetime)

### UserContact GET
*/contact/:Id* - Returns all contact info for a user.

### UserContact POST
*/create-contact* - Provide UserId, ContactValue, ContactType.

*/update-contact* - Provide UserId, ContactValue, ContactType.
