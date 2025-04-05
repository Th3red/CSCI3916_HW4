## Explanation of Project
HW4 Project builds upon the previous API and focuses on creating a review collection. Each review document references a movieId.
To post a review the user needs to be authenticated with a JWT authorization token. The reviews=true query provided, utilizes Mongodb $lookup operator to join reviews with movie data.
## Installation and usage
API_URL=https://csci3916-hw4-a6mf.onrender.com

## Postman
[<img src="https://run.pstmn.io/button.svg" alt="Run In Postman" style="width: 128px; height: 32px;">](https://app.getpostman.com/run-collection/41558294-9224d15a-23ff-4a15-9f2f-7d572bd1d93d?action=collection%2Ffork&source=rip_markdown&collection-url=entityId%3D41558294-9224d15a-23ff-4a15-9f2f-7d572bd1d93d%26entityType%3Dcollection%26workspaceId%3Dffcf64e2-8d61-42ca-8625-b0d3fd347bbc#?env%5Bschmitz-hw4%5D=W3sia2V5IjoiSldUIiwidmFsdWUiOiIiLCJlbmFibGVkIjp0cnVlLCJ0eXBlIjoiZGVmYXVsdCIsInNlc3Npb25WYWx1ZSI6IkpXVC4uLiIsImNvbXBsZXRlU2Vzc2lvblZhbHVlIjoiSldUIGV5SmhiR2NpT2lKSVV6STFOaUlzSW5SNWNDSTZJa3BYVkNKOS5leUpwWkNJNklqWTNaakF6TkRsbVpEZGhObVk1TlRkbFl6UTNPVGhoWWlJc0luVnpaWEp1WVcxbElqb2lhbTlvYmpFeU1qSXpNakpBWjIxaGFXd3VZMjl0SWl3aWFXRjBJam94TnpRek9EZ3lORFV4TENKbGVIQWlPakUzTkRNNE9EWXdOVEY5LkJPTW1GSjhieXY0c09hSjFIR0dya1FFRENUSU5HRVZWbXduYWtkVFhNYjgiLCJzZXNzaW9uSW5kZXgiOjB9XQ==)