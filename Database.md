Database

User
 - id
 - name
 
Authentication
 - uid
 - 
 - access_token

StravaActivity
 - id
 - activity_id
 - raw_data : text
 - name
 - start_date
 
Route
 - id
 - source : string = StravaActivity | StravaSegment | StravaRoute
 - source_id : string
 - name
 - style
 - data_id
 
#Pathdata
# - id
# - data_json
 
Waypoint
 - name
 - distance_at (m)
 - elevation
 - format options?
