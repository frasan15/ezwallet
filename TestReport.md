# Test Report

<The goal of this document is to explain how the application was tested, detailing how the test cases were defined and what they cover>

# Contents

- [Dependency graph](#dependency-graph)

- [Integration approach](#integration-approach)

- [Tests](#tests)

- [Coverage](#Coverage)





# Dependency graph 

     image.png
     
# Integration approach

    <Write here the integration sequence you adopted, in general terms (top down, bottom up, mixed) and as sequence
    (ex: step1: unit A, step 2: unit A+B, step 3: unit A+B+C, etc)> 
    <Some steps may  correspond to unit testing (ex step1 in ex above)>
    <One step will  correspond to API testing, or testing unit route.js>
    


# Tests

   <in the table below list the test cases defined For each test report the object tested, the test level (API, integration, unit) and the technique used to define the test case  (BB/ eq partitioning, BB/ boundary, WB/ statement coverage, etc)>   <split the table if needed>


| Test case name | Object(s) tested | Test level | Technique used |
|--|--|--|--|
| createTransaction | createTransaction | unit, integration | WB statement coverage |
| should return 401 if the user is not authorized|||||
| should return 400 if any of the body params are missing or invalid|||||
| should return 400 if any of the body params are empty strings|||||
| should return 400 if the amount is not a number|||||
| should return 400 if user in transaction does not exist|||||
| should return 400 if category in transaction does not exist|||||
| should return 200 if the transaction is created successfully|||||
| getAllTransactions | getAllTransactions | unit, integration | WB statement coverage |
| should return 401 if the user is not authorized|||||
| should return 200 with an array with all transactions|||||
| should return 200 with an array with empty transactions array|||||
| getTransactionsByUser | getTransactionsByUser | unit, integration | WB statement coverage |
|Returns data content of the Transactions of common user|||||
|Returns a 400 error if the username passed as a route parameter does not represent a user in the database|||||
|Returns a 401 error if called by an authenticated user who is not the same user as the one in the route (authType = User) if the route is `/api/users/:username/transactions`|||||
|Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin) if the route is `/api/transactions/users/:username`|||||
| getTransactionsByUserByCategory | getTransactionsByUserByCategory | unit, integration | WB statement coverage |
|Returns data content of the Transactions By User By Category|||||
|Returns a 400 error if the username passed as a route parameter does not represent a user in the database|||||
|Returns a 400 error if the category passed as a route parameter does not represent a category in the database|||||
|Returns a 401 error if called by an authenticated user who is not the same user as the one in the route (authType = User) if the route is `/api/users/:username/transactions/category/:category`|||||
|Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin) if the route is `/api/transactions/users/:username/category/:category`|||||
| getTransactionsByGroup | getTransactionsByGroup | unit, integration | WB statement coverage |
|should return 401 if the user is not authorized|||||
|should return 200 with an array with all transactions of the group|||||
| getTransactionsByGroupByCategory | getTransactionsByGroupByCategory | unit, integration | WB statement coverage |
|Returns data content of the Transactions|||||
|Returns a 400 error if the group name passed as a route parameter does not represent a group in the database|||||
|Returns a 400 error if the category passed as a route parameter does not represent a category in the database|||||
|Returns a 401 error if called by an authenticated user who is not part of the group (authType = Group) if the route is `/api/groups/:name/transactions/category/:category`|||||
|Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin) if the route is `/api/transactions/groups/:name/category/:category`|||||
| deleteTransaction | deleteTransaction | WB statement coverage |
| should return 401 if the user is not authorized ||||
| should return 400 if the transaction id is invalid ||||
| should return 200 and a message if the transaction is deleted ||||
| deleteTransactions | deleteTransactions | unit, integration | WB statement coverage |
|Returns data content of deleted Transactions||||
|Returns a 400 error if the request body does not contain all the necessary attributes||||
|Returns a 400 error if at least one of the ids in the array is an empty string||||
|Returns a 400 error if at least one of the ids in the array does not represent a transaction in the database||||
|Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin)||||
| register | register | unit, integration | WB statement coverage |
| Should return 400 if request body does not contain all the necessary attributes ||||
| Should return 400 if at least one of the parameters in the request body is an empty string ||||
| Should return 400 if the email in the request body is not in a valid email format ||||
| Should return 400 if the username in the request body identifies an already existing user ||||
| Should return 400 if the email in the request body identifies an already existing user ||||
| Should return 200 if the user is added successfully ||||
| registerAdmin | registerAdmin | unit, integration | WB statement coverage |
| Should return 400 if request body does not contain all the necessary attributes ||||
| Should return 400 if at least one of the parameters in the request body is an empty string ||||
| Should return 400 if the email in the request body is not in a valid email format ||||
| Should return 400 if the username in the request body identifies an already existing user ||||
| Should return 400 if the email in the request body identifies an already existing user ||||
| Should return 200 if the user is added successfully ||||
| handleDateFilterParams | handleDateFilterParams | unit, integration | WB statement coverage |
| Returns a filter object which contains data attribute if only "date" is present in query ||||
| Throws an error if at least one of the query parameters is not a date in the format "YYYY-MM-DD" ||||
| Throws an error if in the query "date" parameter is present with either "from" or "upTo" ||||
| handleAmountFilterParams | handleAmountFilterParams | unit, integration | WB statement coverage |
| Function called with either min and/or max should return a filter object with mix and/or max attributes ||||
| Should throw an error if min or max are passed with strings that do cannot be parsed as number ||||
| getUsers | getUsers | unit, integration | WB statement coverage |
| should return empty list if there are no users ||||
| should retrieve list of all users ||||
| should return 401 if user is not authorized ||||
| getUser | getUser | unit, integration | WB statement coverage |
| Returns requested user ||||
| Returns a 400 error if the username passed as the route parameter does not represent a user in the database ||||
| Returns a 401 error if called by an authenticated user who is neither the same user as the one in the route parameter (authType = User) nor an admin (authType = Admin) ||||
| deleteUser | deleteUser | unit, integration | WB statement coverage |
| should return 401 if user is not authorized ||||
| should return 400 if email is missing, empty or invalid ||||
| should return 400 if user does not exist in database ||||
| should return 400 if user is an admin ||||
| should return 200 if user and his transactions are deleted, with one user in a group ||||
| Logout | Logout | unit, integration | WB statement coverage |
| Return 400 error if refreshToken cookie is not provided ||||
| Return 400 error if user with the provided refreshToken is not found ||||
| successfully log out the user ||||
| Return 400 error if an error occurs during logout ||||
| updateCategory | updateCategory | unit, integration | WB statement coverage |
| Return 401 error if called by an authenticated user who is not an admin ||||
| Return 400 error if Request body does not contain all the necessary attributes ||||
| Return 400 error if request body is an empty string||||
| Return 400 error if the type of category in request params is not exist in the database ||||
| Return 400 error if the type of category passed in the request body is already existing in the database ||||
|Category Updated succesfully ||||
| deleteCategory | deleteCategory | unit, integration | WB statement coverage |
| Category Deleted successfully ||||
| Return 401 Error if user is Unauthorized ||||
| Return 400 Error if only one category is left ||||
| Return 400 Error if Request body is Empty ||||
| Return 400 if the category is not exist in DataBase ||||
| Retrieve last category if N equals T ||||
| Return 400 error if the request body does not contain all the necessary attributes ||||
| removeFromGroup | removeFromGroup | unit, integration | WB statement coverage |
| Remove members from group as admin ||||
| Return 401 unauthorized if not an admin or group member ||||
| Return 400 error if the request body does not contain all the necessary attributes ||||
|Return 400 error if the group name passed as a route parameter does not represent a group in the database ||||
| Return 400 error if at least one of the emails is an empty string ||||
| deleteGroup | deleteGroup | unit, integration | WB statement coverage |
| Group has been successfully deleted ||||
| Return 400, if User is not Authorized ||||
| Return 400 if the request body does not contain all the necessary attributes  ||||
| Returns a 400 error if the name passed in the request body is an empty string ||||
| Return  400 error if group is not exist ||||
| verifyAuth | verifyAuth | unit, integration | WB statement coverage |
| Return unauthorized if one token is missing ||||
| Return unauthorized if one token is missing information ||||
| Return unauthorized if one token is missing information ||||
| Return unauthorized if one token are from different user ||||
| Return simple authorization ||||
| Return user authorization ||||
| Return user authorization with expired date ||||
| Return invalid user ||||
| Return admin authorization ||||
| Return admin authorization with expired date ||||
| Return invalid admin ||||
| Return group authorization ||||
| Return group authorization with expired date ||||
| Return user not in group ||||
| Return user authorization ||||
| Suggest to perform login ||||
| Should raise error ||||
| login | login | unit, integration | WB statement coverage |
| login performed succesfully ||||
| Returns a 400 error if the request body does not contain all the necessary attributes |||
| Returns a 400 error if the email in the request body is not in a valid email format ||||
| Returns a 400 error if at least one of the parameters in the request body is an empty string ||||
| Returns a 400 error if the email in the request body does not identify a user in the database ||||
| Returns a 400 error if the supplied password does not match with the one in the database ||||
| createCategory | createCategory | unit, integration | WB statement coverage |
| category correctly created ||||
| Returns a 400 error if the type of category passed in the request body represents an already existing category in the database ||||
| Returns a 400 error if the request body does not contain all the necessary attributes ||||
| returns a 400 error if at least one of the parameters in the request body is an empty string ||||
| returns a 401 error if called by an authenticated user who is not an admin (authType = Admin) ||||
| getCategories | getCategories | unit, integration | WB statement coverage |
| categories correctly returned ||||
| Returns a 401 error if called by a user who is not authenticated (authType = Simple) ||||
| createGroup | createGroup | unit, integration | WB statement coverage |
| all members added correctly, except for one of them who does not exist and the other who already belongs to another group ||||
| all members correctly added, the user's email who is calling the API is already present in the request's members array ||||
| Returns a 400 error if the request body does not contain all the necessary attributes ||||
| Returns a 400 error if the group name passed in the request body represents an already existing group in the database ||||
| Returns a 400 error if the group name passed in the request body is an empty string ||||
| Returns a 400 error if all the provided emails represent users that are already in a group or do not exist in the database ||||
| Returns a 400 error if the user who calls the API is already in a group ||||
| Returns a 400 error if at least one of the member emails is not in a valid email format ||||
| Returns a 401 error if called by a user who is not authenticated (authType = Simple) ||||
| getGroups | getGroups | unit, integration | WB statement coverage |
| it returns correctly the two groups ||||
| it returns empty list if there are no groups ||||
| Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin) ||||
| getGroup | getGroup | unit, integration | WB statement coverage |
| It returns the requested group if called by an Admin ||||
| It returns the requested group if called by a regular user who is part of the group ||||
| it returns 400 error if the requested group does not exist ||||
| it returns 401 error if called by a regular user who is not part of the group ||||
| addToGroup | addToGroup | unit, integration | WB statement coverage | 
| Method called by an admin, returned with success ||||
| Method called by a regular user belonging to the requested group, returned with success ||||
| Returns a 400 error if the group name passed as a route parameter does not represent a group in the database ||||








# Coverage



## Coverage of FR

<Report in the following table the coverage of  functional requirements (from official requirements) >

| Functional Requirements covered |   Test(s) | 
| ------------------------------- | ----------- | 
| FR1 Manage | ------- |
| FR11 register | Should return 400 if request body does not contain all the necessary attributes |
|| Should return 400 if at least one of the parameters in the request body is an empty string |
|| Should return 400 if the email in the request body is not in a valid email format |
|| Should return 400 if the username in the request body identifies an already existing user |
|| Should return 400 if the email in the request body identifies an already existing user |
|| Should return 200 if the user is added successfully |
| FR12 login | login performed succesfully |
| | Returns a 400 error if the request body does not contain all the necessary attributes |
| | Returns a 400 error if the email in the request body is not in a valid email format |
| | Returns a 400 error if at least one of the parameters in the request body is an empty string |
| | Returns a 400 error if the email in the request body does not identify a user in the database |
| | Returns a 400 error if the supplied password does not match with the one in the database |
| FR13 logout | Should return 400 error if refreshToken cookie is not provided  |
|| Should return 400 error if user with the provided refreshToken is not found |
|| Should return 400 error if an error occurs during logout |
|| Should successfully log out the user  |
| FR14 registerAdmin | Should return 400 if request body does not contain all the necessary attributes |
|| Should return 400 if at least one of the parameters in the request body is an empty string |
|| Should return 400 if the email in the request body is not in a valid email format |
|| Should return 400 if the username in the request body identifies an already existing user |
|| Should return 400 if the email in the request body identifies an already existing user |
|| Should return 200 if the user is added successfully |
| FR15 getUsers | should return empty list if there are no users |
|| should retrieve list of all users |
|| should return 401 if user is not authorized |
| FR16 getUser | |
||Returns requested user|
||Returns a 400 error if the username passed as the route parameter does not represent a user in the database|
||Returns a 401 error if called by an authenticated user who is neither the same user as the one in the route parameter (authType = User) nor an admin (authType = Admin)|
| FR17 deleteUser | should return 401 if user is not authorized |
|| should return 400 if email is missing, empty or invalid |
|| should return 400 if user does not exist in database |
|| should return 400 if user is an admin |
|| should return 200 if user and his transactions are deleted, with one user in a group |
| FR2 Manage | |
| FR21 createGroup | all members added correctly, except for one of them who does not exist and the other who already belongs to another group |
| | all members correctly added, the user's email who is calling the API is already present in the request's members array |
| | Returns a 400 error if the request body does not contain all the necessary attributes |
| | Returns a 400 error if the group name passed in the request body represents an already existing group in the database |
| | Returns a 400 error if the group name passed in the request body is an empty string |
| | Returns a 400 error if all the provided emails represent users that are already in a group or do not exist in the database |
| | Returns a 400 error if the user who calls the API is already in a group |
| | Returns a 400 error if at least one of the member emails is not in a valid email format |
| | Returns a 401 error if called by a user who is not authenticated (authType = Simple) |
| FR22 getGroups | it returns correctly the two groups |
| | it returns empty list if there are no groups |
| | Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin) |
| FR23 getGroup | It returns the requested group if called by an Admin |
| | It returns the requested group if called by a regular user who is part of the group |
| | it returns 400 error if the requested group does not exist |
| | it returns 401 error if called by a regular user who is not part of the group |
| FR24 addToGroup | Method called by an admin, returned with success |
| | Method called by a regular user belonging to the requested group, returned with success |
| | Returns a 400 error if the group name passed as a route parameter does not represent a group in the database |
| FR26 removeFromGroup | Should remove members from group as admin |
|| Should return 401 unauthorized if not an admin or group member  |
||  Should return 400 error if the request body does not contain all the necessary attributes |
|| Should return 400 error if the group name passed as a route parameter does not represent a group in the database |
||  Should return 400 error if at least one of the emails is an empty string  |
| FR28 deleteGroup |Should delete group successfuly |
|| Should Return 401, if User is not Authorized |
|| Should return 400 if the request body does not contain all the necessary attributes |
|| Should Returns a 400 error if the name passed in the request body is an empty string |
|| Should Return  400 error if group is not exist |
|  FR3 Manage | |
| FR31 
| FR32 getAllTransactions | should return 401 if the user is not authorized|
|| should return 200 with an array with all transactions|
|| should return 200 with an array with empty transactions array|
| FR33 getTransactionsByUser | |
|| Returns data content of the Transactions of common user|
|| Returns a 400 error if the username passed as a route parameter does not represent a user in the database|
|| Returns a 401 error if called by an authenticated user who is not the same user as the one in the route (authType = User) if the route is `/api/users/:username/transactions`|
|| Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin) if the route is `/api/transactions/users/:username`|
| FR34 getTransactionsByUserByCategory||
|| Returns data content of the Transactions By User By Category|
|| Returns a 400 error if the username passed as a route parameter does not represent a user in the database|
|| Returns a 400 error if the category passed as a route parameter does not represent a category in the database|
|| Returns a 401 error if called by an authenticated user who is not the same user as the one in the route (authType = User) if the route is `/api/users/:username/transactions/category/:category`|
|| Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin) if the route is `/api/transactions/users/:username/category/:category`|
| FR35 getTransactionsByGroup | |
|| should return 401 if the user is not authorized|
|| should return 200 with an array with all transactions of the group|
| FR36 getTransactionsByGroupByCategory | |
|| Returns data content of the Transactions|
|| Returns a 400 error if the group name passed as a route parameter does not represent a group in the database|
|| Returns a 400 error if the category passed as a route parameter does not represent a category in the database|
|| Returns a 401 error if called by an authenticated user who is not part of the group (authType = Group) if the route is `/api/groups/:name/transactions/category/:category`|
|| Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin) if the route is `/api/transactions/groups/:name/category/:category`|
| FR37 deleteTransaction | should return 401 if the user is not authorized |
|| should return 400 if the transaction id is invalid |
|| should return 200 and a message if the transaction is deleted |
| FR38 deleteTransactions | |
|| Returns data content of deleted Transactions|
|| Returns a 400 error if the request body does not contain all the necessary attributes|
|| Returns a 400 error if at least one of the ids in the array is an empty string|
|| Returns a 400 error if at least one of the ids in the array does not represent a transaction in the database|
|| Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin)|
| FR4 Manage | |
| FR41 createCategory | category correctly created |
| | Returns a 400 error if the type of category passed in the request body represents an already existing category in the database |
| | Returns a 400 error if the request body does not contain all the necessary attributes |
| | returns a 400 error if at least one of the parameters in the request body is an empty string |
| | returns a 401 error if called by an authenticated user who is not an admin (authType = Admin) |
| FR42 updateCategory | Should return 401 error if called by an authenticated user who is not an admin |
|| Should 400 error if the request body does not contain all the necessary attributes  |
|| Should return 400 error if request body is an empty string  |
|| Should return 400 error if the type of category in request params is not exist in the database |
|| Should return 400 error if the type of category passed in the request body is already existing in the database |
||  Should Updated Category succesfully |
| FR43 deleteCategory | Should delete category successfully |
|| Should return 401 Error if user is Unauthorized |
|| Should return 400 Error if only one category is left |
|| Should return 400 Error if Request body is Empty |
|| Should return 400 if the category is not exist in DataBase |
||  Should return 400 error if the request body does not contain all the necessary attributes |
||  Should retrieve last category if N equals T |
|| |
|| |
|| |
| FR44 getCategories | categories correctly returned |
| | Returns a 401 error if called by a user who is not authenticated (authType = Simple) |


## Coverage white box

Report here the screenshot of coverage values obtained with jest-- coverage 






