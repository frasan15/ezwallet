# Requirements Document - future EZWallet

Date: 28/04/2023

Version: V2 - description of EZWallet in FUTURE form (as proposed by the team)
 
| Version number | Change |
| ----------------- |:-----------:|
| 1.0 | Add V1 |
| 1.1 | Add extra use cases and diagrams |
| 1.2 | Add remaining diagrams and last details |

# Contents

- [Informal description](#informal-description)
- [Stakeholders](#stakeholders)
- [Context Diagram and interfaces](#context-diagram-and-interfaces)
	+ [Context Diagram](#context-diagram)
	+ [Interfaces](#interfaces) 
	
- [Stories and personas](#stories-and-personas)
- [Functional and non functional requirements](#functional-and-non-functional-requirements)
	+ [Functional Requirements](#functional-requirements)
	+ [Non functional requirements](#non-functional-requirements)
- [Use case diagram and use cases](#use-case-diagram-and-use-cases)
	+ [Use case diagram](#use-case-diagram)
	+ [Use cases](#use-cases)
    	+ [Relevant scenarios](#relevant-scenarios)
- [Glossary](#glossary)
- [System design](#system-design)
- [Deployment diagram](#deployment-diagram)

# Informal description
EZWallet (read EaSy Wallet) is a software application designed to help individuals and families keep track of their expenses. Users can enter and categorize their expenses, allowing them to quickly see where their money is going. EZWallet is a powerful tool for those looking to take control of their finances and make informed decisions about their spending.



# Stakeholders


| Stakeholder name  | Description | 
| ----------------- |:-----------:|
|   Users     |      People using the app in order to keep track of their expenses could be anyone who wants to manage the expenses of a person or a family)     | 
| Administrator | DB administrator (manages DBMSs on which the app is based) and IT administrator (admin, manages the application) |
| Web server | Services to make the application available | 
| Google Ads Provider | Responsible to provide ads for application |

# Context Diagram and interfaces

## Context Diagram

![Context Diagram](images/V2/Context_Diagram.jpg)

## Interfaces

| Actor | Logical Interface | Physical Interface  |
| ------------- |:-------------:| -----:|
|   User     | GUI | WEB |
|   Admin   | GUI | PC |
|   Google Ads Provider   | https://ads.google.com/home/ | Internet link |

# Stories and personas

Persona 1:
 - 35 year old female, single mother of 2, low income professional
Story:
 - She wants to keep track of her spendings, to save money and invest the rest of the month’s income. Earns 1000€ monthly and after using it for essential services, she wants to save money and put it in an investment for her children

Persona 2:
 - 22 year old male, student in a foreign country, lives out of parents’ money
Story:
 - This person wants to control his expenses while in a different country from his own, he wants to inform his parents about how much he is spending.

Persona 3:
 - 27 year old male, has a flexible work and travels a lot, medium income
Story:
 - He wants to see how much he is spending during his day to day to save money to plan
next trips with the budget remaining from the month. Using EzWallet he can see how he can avoid
unnecessary spendings. 

Persona 4:
 - Dad of a family, 55 years old, 
Story: 
 - The dad of a family realizes that his family is having too much expenses and wants to control and analyze it in order to reduce them.

Persona 5:
 - 30 year old female in vacation
Story:
A young adult is going to travel and wants to keep track of his expenses during the trip to not surpass his budget.

# Functional and non functional requirements

## Functional Requirements


| ID        | Description  |
| ------------- |:-------------:| 
|  FR1     | Account Management |
| FR1.1    | Register new user |
| FR1.2  | Delete Account | 
|  FR2     |  Authorize and authenticate |
|  FR2.1     |  Login |
| FR2.2  | Logout | 
| FR2.3  | Reset password | 
|  FR3     |  Categories Management |
| FR3.1  | Create Categories | 
| FR3.2  | Get Categories | 
| FR3.3  | Delete Categories |
| FR2.4  | Sum of transactions per category |  
|  FR4     |  Transactions Management |
| FR4.1  | Create Transaction | 
| FR4.2  | Delete Transaction | 
| FR4.3  | Get Labels | 
| FR4.4  | Get expenses statistics |
| FR2.5  | Search transaction |  

## Non Functional Requirements


| ID        | Type (efficiency, reliability, ..)           | Description  | Refers to |
| ------------- |:-------------:| :-----:| -----:|
|  NFR1     | Security | An identification through email and password is requested. | FR1|
|  NFR2     | Security | Password must be stored hashed in the database | FR1 |
| NFR3 | Security | Users cannot manage the expenses from other users| FR4 | 
| NFR4 | Correctness | Application should retrieve all and only expenses required from the user| FR4 | 
| NFR5 | Efficiency | Application should retrieve all labels in less than 0.5s | FR4.3 | 
| NFR6 | Efficiency | Email must arrive to user for resetting password in less than 3 seconds | FR2.3 | 
| NFR7 | Security | Password reset process must follow the same security steps as FR1  | FR2.3 | 
| NFR8 | Efficiency | Expenses statistics and graphs must be created in less than 1 second  | FR4.4 | 

# Use case diagram and use cases


## Use case diagram

![UseCases](images/V2/UseCases.png)


### Login use case, UC1
| Actors Involved        |  |
| ------------- |:-------------:| 
|  Precondition     | Client already has an account on EZWallet |
|  Post condition     |  User is authenticated and authorized |
|  Nominal Scenario     | Scenario 1.1 |
|  Variants     | Username, password, and email have to be correct |
|  Exceptions     | Scenarios 1.2 and 1.3 |

##### Scenario 1.1 

| Scenario 1.1 | |
| ------------- |:-------------:| 
|  Precondition     | User is unauthenticated |
|  Post condition     | User is authenticated and authorized |
| Step#        | Description  |
|  1     | User opens website |  
|  2     | Session is expired, sent to Login screen | 
|  3     | User inserts email and password |  
|  4     | User presses the Login button |
|  5     | User can proceed to visualization of his/her transactions and categories |

##### Scenario 1.2

| Scenario 1.2 | |
| ------------- |:-------------:| 
|  Precondition     | User is unauthenticated |
|  Post condition     | User is unauthenticated |
| Step#        | Description  |
|  1     | User opens website |  
|  2     | Session is expired, sent to Login screen |  
|  3     | User inserts email and password |  
|  4     | User presses the Login button |
|  5     | Password is wrong, user gets an error message |
|  6     | User remains in the login screen |

##### Scenario 1.3

| Scenario 1.3 | |
| ------------- |:-------------:| 
|  Precondition     | User is unauthenticated |
|  Post condition     | User is unauthenticated |
| Step#        | Description  |
|  1     | User opens website |  
|  2     | Session is expired, sent to Login screen |  
|  3     | User inserts email and password |  
|  4     | User presses the Login button |
|  5     | User not found in database, user gets an error message |
|  6     | User remains in the login screen |


### Register Account use case, UC2

| Actors Involved        |  |
| ------------- |:-------------:| 
|  Precondition     | Client does not have an account on EZWallet |
|  Post condition     |  User is authenticated and authorized |
|  Nominal Scenario     | Scenario 2.1 |
|  Variants     | - |
|  Exceptions     | Scenario 2.2 |

##### Scenario 2.1 

| Scenario 2.1 | |
| ------------- |:-------------:| 
|  Precondition     | User does not have account |
|  Post condition     | User is authenticated and authorized |
| Step#        | Description  |
|  1     | User opens website and taken to Login screen |
|  2     | User clicks on Create new account button |  
|  3     | User inserts email, username and password |  
|  4     | User presses the Sign up button |
|  5     | System creates new user |
|  6     | User can proceed to visualization of his/her transactions and categories |

##### Scenario 2.2

| Scenario 2.2 | |
| ------------- |:-------------:| 
|  Precondition     | User is unauthenticated |
|  Post condition     | User is unauthenticated |
| Step#        | Description  |
|  1     | User opens website and taken to Login screen |
|  2     | User clicks on Create new account button |  
|  3     | User inserts email, username and password |  
|  4     | User presses the Sign up button |
|  5     | Email already in use, user gets an error message |
|  6     | User remains in the Login screen |

### Logout use case, UC3

| Actors Involved        |  |
| ------------- |:-------------:| 
|  Precondition     | User is authenticated and authorized |
|  Post condition     |  User is unauthenticated |
|  Nominal Scenario     | Scenario 3.1 |
|  Variants     | - |
|  Exceptions     | User is already authenticated |

##### Scenario 3.1 

| Scenario 3.1 | |
| ------------- |:-------------:| 
|  Precondition     | User is authenticated |
|  Post condition     | User is unauthenticated in the login screen |
| Step#        | Description  |
|  1     | User is in any screen while authenticated |  
|  2     | User clicks profile icon in the top right corner |  
|  3     | User clicks Log out button |
|  4     | System resets user's session tokens |
|  5     | User taken to login screen |

### Create new Category use case, UC4

| Actors Involved        |  |
| ------------- |:-------------:| 
|  Precondition     | User is authenticated and authorized |
|  Post condition     | New category is in database |
|  Nominal Scenario     | Scenario 4.1 |
|  Variants     | Type and color inputs |
|  Exceptions     | Scenario 4.2 |

#### Scenario 4.1
| Scenario 4.1 | |
| ------------- |:-------------:| 
|  Precondition  | User is authenticated |
|  Post condition | New category added to database |
| Step#        | Description  |
|  1     | User is at categories screen |
|  2     | User clicks Add new category button |
|  3     | Two text inputs appear at the bottom |
|  4     | User fills the form with a type and color |
|  5     | User clicks button add |
|  6     | New category added to database |

#### Scenario 4.2
| Scenario 4.2 | |
| ------------- |:-------------:| 
|  Precondition  | User is authenticated |
|  Post condition | Category not added to database |
| Step#        | Description  |
|  1     | User is at categories screen |
|  2     | User clicks Add new category button |
|  3     | Two text inputs appear at the bottom |
|  4     | User does leaves form blank |
|  5     | User clicks button add |
|  6     | User gets an error message |

### Add new transaction use case, UC5

| Actors Involved        |  |
| ------------- |:-------------:| 
|  Precondition     | User is authenticated in the transactions screen |
|  Post condition     |  New transaction is added to database |
|  Nominal Scenario     | Scenario 5.1 |
|  Variants     | Name, price and date inputs |
|  Exceptions     | User is unauthenticated, Scenario 5.2 |

##### Scenario 5.1 

| Scenario 5.1 | |
| ------------- |:-------------:| 
|  Precondition     | User is authenticaged in the transactions screen |
|  Post condition     | Transaction added to database and user list |
| Step#        | Description  |
|  1     | User is in the categories screen |
|  2     | User clicks on a certain category |  
|  3     | screen of the selected category is loaded with transactions |  
|  4     | User presses the Add Expense button |
|  5     | Enters another screen for filling the expense information | 
|  5     | User fills out form to add new transaction (name, price, date) |
|  6     | User clicks button Add |
|  7     | User is taken back to all transactions view, with the new expense added |

#### Scenario 5.2

| Scenario 5.2 | |
| ------------- |:-------------:| 
|  Precondition | User is authenticated in the transactions screen |
|  Post condition | Transaction not added to database |
| Step#        | Description  |
|  1     | User is in the categories screen |
|  2     | User clicks on a certain category |  
|  3     | screen of the selected category is loaded with transactions |  
|  4     | User presses the Add Expense button |
|  5     | Enters another screen for filling the expense information | 
|  5     | User does not fill out form to add new transaction or adds invalid date |
|  6     | User clicks button Add |
|  7     | User is gets an error message |


### Delete Transaction use case, UC6

| Actors Involved        |  |
| ------------- |:-------------:| 
|  Precondition     | User is authenticated and authorized |
|  Post condition     | Transaction is in not database anymore |
|  Nominal Scenario     | Scenario 6.1 |
|  Variants     | - |
|  Exceptions     | User not authenticated |

#### Scenario 6.1
| Scenario 6.1 | |
| ------------- |:-------------:| 
|  Precondition  | User is authenticated |
|  Post condition | Transaction deleted from database |
| Step#        | Description  |
|  1     | User is at transactions screen |
|  2     | User selects a row from transactions table |
|  3     | User clicks button delete |
|  4     | Request sent to server and transaction is deleted from database and user's list in front end |

### Forgot password use case, UC7

| Actors Involved        |  |
| ------------- |:-------------:| 
|  Precondition     | User is unauthenticated |
|  Post condition     | User is authenticated |
|  Nominal Scenario     | Scenario 7.1 |
|  Variants     | - |
|  Exceptions     | User authenticated |

#### Scenario 7.1
| Scenario 7.1 | |
| ------------- |:-------------:| 
|  Precondition  | User is unauthenticated |
|  Post condition | User is authenticated |
| Step#        | Description  |
|  1     | User is at login screen |
|  2     | User clicks on "Retrieve it" button for forgotten password |
|  3     | User inserts email in input form |
|  4     | User presses "Send" button |
|  5     | User receives email containing link to reset password |
|  6     | User clicks link and is redirected to login page to reset password |
|  7     | User inserts new password and logs in |

### Statistics about expenses use case, UC8

| Actors Involved        |  |
| ------------- |:-------------:| 
|  Precondition     | User is authenticated |
|  Post condition     | Expenses graphs are on screen |
|  Nominal Scenario     | Scenario 8.1 |
|  Variants     | - |
|  Exceptions     | User unauthenticated |

#### Scenario 8.1
| Scenario 8.1 | |
| ------------- |:-------------:| 
|  Precondition  | User is authenticated |
|  Post condition | Expenses graphs are on screen |
| Step#        | Description  |
|  1     | User is at categories screen |
|  2     | User clicks button "See statistics" |
|  3     | User is taken to another page |
|  4     | Pie chart and bar chart are loaded containing information about all expenses |


### Search transactions use case, UC9

| Actors Involved        |  |
| ------------- |:-------------:| 
|  Precondition     | User is authenticated |
|  Post condition     | User is authenticated |
|  Nominal Scenario     | Scenario 9.1 |
|  Variants     | - |
|  Exceptions     | User unauthenticated |

#### Scenario 9.1
| Scenario 9.1 | |
| ------------- |:-------------:| 
|  Precondition  | User is authenticated |
|  Post condition | Expenses graphs are on screen |
| Step#        | Description  |
|  1     | User is at transactions screen |
|  2     | User clicks search bar "Search transaction by name" |
|  3     | Only entries that match the entered text are shown in the table |

### Delete Account use case, UC10
| Actors Involved        |  |
| ------------- |:-------------:| 
|  Precondition     | user is authorized and authenticate |
|  Post condition     | delete account from database   |
|  Nominal Scenario     | Scenario 10.1 |
|  Variants     |  |
|  Exceptions     |  | 

| Scenario 10.1 | |
| ------------- |:-------------:| 
|  Precondition     | user want to delete account |
|  Post condition     | delete account from database  |
| Step#        |   |
|  1     | User is in authorized in any page, click on the profile icon in the top right corner |  
|  2     | User will see a list contained "Log out" and "Delete Account" |
|  3     | User click on delete account  |
|  4     | System sent notification to user: “ Are you want to delete the account ? “  |
|  5     | System show 2 bottom: “Yes” “No” |
|  6     | User click on “Yes” bottom |
|  7     | System delete account from database  |

### Sum of all transaction by category use case, UC11
| Actors Involved        |  |
| ------------- |:-------------:| 
|  Precondition     | user want to see the sum of all transaction in a category|
|  Post condition     | sum of all transaction will show |
|  Nominal Scenario     | Scenario 11.1 |
|  Variants     |  |
|  Exceptions     |  | 

| Scenario 11.1 | |
| ------------- |:-------------:| 
|  Precondition     | user is authenticated and authorized |
|  Post condition     | User is not authenticated and unauthorized |
| Step#        |   |
|  1     | User is on Category page |   
|  2     | User choose one category   |
|  3     | User click on the bottom “Sum all transactions”   |
|  4     | System calculates the sum   |
|  5     | System show sum in a box the total amount of trasactions   |

### Delete category use case, UC12
| Actors Involved        |  |
| ------------- |:-------------:| 
|  Precondition     | user want to delete a category |
|  Post condition     | category delete completely   |
|  Nominal Scenario     | Scenario 12.1 |
|  Variants     |  |
|  Exceptions     |  | 

| Scenario 12.1 | |
| ------------- |:-------------:| 
|  Precondition     | user want to delet a category |
|  Post condition     | category delete completely |
| Step#        |   |
|  1     | User is on category page |   
|  2     | User choose one category   |
|  3     | User click on the bottom “delete this category”   |
|  4     | category delete successfully  |

# Glossary

![Glossary](images/V2/Glossary.png)

# System Design
![System Designe](images/V2/System_Designe_V2.jpg)

# Deployment Diagram 

![Glossary](images/V1/deployment_diagram.png)


# Solved Defects

### Defect 1

After user logs in, he or she can choose another account to see their transactions. This is a privacy problem. 
It was solved by having an account attached to just only one user in the application.

### Defect 2

The getUsers function requires to be called by a user who has Admin privileges, however this function is vital for login, where users are unathenticated and with no privileges.
It was solved by removing the required Admin privilege to call the function.

### Defect 3

The getLabel function may not have the intended results, because there is not aggregation function after joining with the categories table. In this case, the results will not be summed by category, instead every transaction will have the category and color attached to its object.
Solved by adding a sum aggregation function to sum all transactions based on a certain category.

### Defect 4

In the controllers/controller.js file, the create_transaction function uses an object with no date attribute to be added to the database, as it is declared in the models/model.js.
Solved by including the date when inserting the object in the database.

