import { Group, User } from "../models/User.js";
import { transactions } from "../models/model.js";
import { verifyAuth } from "./utils.js";
import { getAllTransactions } from "./controller.js";
import { isValidEmail } from "./utils.js";

/**
 * Return all the users
- Request Parameters: None
- Request Body Content: None
- Response `data` Content: An array of objects, each one having attributes `username`, `email` and `role`
  - Example: `res.status(200).json({data: [{username: "Mario", email: "mario.red@email.com"}, {username: "Luigi", email: "luigi.red@email.com"}, {username: "admin", email: "admin@email.com"} ], refreshedTokenMessage: res.locals.refreshedTokenMessage})`
- Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin)
 */
export const getUsers = async (req, res) => {
  try {
    const cookie = req.cookies;
    if (!cookie.accessToken) {
      return res.status(401).json({ message: "Unauthorized" }); // unauthorized
    }

      // check if the authenticated user is admin
    const isAdmin = verifyAuth(req, res, {authType:"Admin"})

    if(!isAdmin.authorized){
      return res.status(401).json({ message: isAdmin.cause }); // unauthorized
    }

    const users = await User.find({}, 'username email role -_id')
    .then(users => {
      // Check if any users are found
      if (users.length === 0) {
        return []; // Return an empty array if there are no users
      }

      // Return the array of users
      return users;})

    res.status(200).json({data: users, refreshedTokenMessage: res.locals.refreshedTokenMessage});
  } catch (error) {
    res.status(500).json(error.message);
  }
};

/**
 * Return information of a specific user
- Request Parameters: A string equal to the `username` of the involved user
  - Example: `/api/users/Mario`
- Request Body Content: None
- Response `data` Content: An object having attributes `username`, `email` and `role`.
  - Example: `res.status(200).json({data: {username: "Mario", email: "mario.red@email.com", role: "Regular"}, refreshedTokenMessage: res.locals.refreshedTokenMessage})`
- Returns a 400 error if the username passed as the route parameter does not represent a user in the database
- Returns a 401 error if called by an authenticated user who is neither the same user as the one in the route parameter (authType = User) nor an admin (authType = Admin)
 */
export const getUser = async (req, res) => {
  try {
    const cookie = req.cookies;
    if (!cookie.accessToken || !cookie.refreshToken) {
      return res.status(401).json({ message: "Unauthorized" }); // unauthorized
    }

    const username = req.params.username;
    const userParam = await User.findOne({ username: username }, 'username email role -_id');
    const user = await User.findOne({ refreshToken: cookie.refreshToken }, 'username email role -_id');
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    if (!userParam) {
      return res.status(400).json({ message: "Username not found" });
    }


    // check if the authenticated user is admin
    const isAdmin = verifyAuth(req, res, {authType:"Admin"})

    // check if the authenticated user who is the same user as the one in the route parameter
    const isSameUser = verifyAuth(req, res, {authType: "User", username:req.params.username})

    if (!isSameUser.authorized && !isAdmin.authorized)
      return res.status(401).json({ message: "Unauthorized" });

    res.status(200).json({data: userParam, refreshedTokenMessage: res.locals.refreshedTokenMessage});
  } catch (error) {
    res.status(500).json(error.message);
  }
};

/** 
    
- Request Parameters: None
- Request request body Content: An object having a string attribute for the `name` of the group and an array 
that lists all the `memberEmails`
  - Example: `{name: "Family", memberEmails: ["mario.red@email.com", "luigi.red@email.com"]}`
- Response `data` Content: An object having an attribute `group` (this object must have a string attribute for the `name` of the created group and an array for the `members` of the group), an array that lists the `alreadyInGroup` members (members whose email is already present in a group) and an array that lists the `membersNotFound` (members whose email does not appear in the system)
  - Example: `res.status(200).json({data: {group: {name: "Family", members: [{email: "mario.red@email.com"},
   {email: "luigi.red@email.com"}]}, membersNotFound: [], alreadyInGroup: []}
    refreshedTokenMessage: res.locals.refreshedTokenMessage})`
- If the user who calls the API does not have their email in the list of emails then their email is added to the 
list of members
- Returns a 400 error if the request body does not contain all the necessary attributes
- Returns a 400 error if the group name passed in the request body is an empty string
- Returns a 400 error if the group name passed in the request body represents an already existing group in the database
- Returns a 400 error if all the provided emails represent users that are already in a group or do not exist in the database
- Returns a 400 error if the user who calls the API is already in a group
- Returns a 400 error if at least one of the member emails is not in a valid email format
- Returns a 400 error if at least one of the member emails is an empty string 
- Returns a 401 error if called by a user who is not authenticated (authType = Simple) 
 */

export const createGroup = async (req, res) => {
  try {
    const user = verifyAuth(req, res, {authType: "Simple"});
    if (!user || !user.authorized)
      return res.status(401).json({ message: "Unauthorized" });
    const { name, memberEmails } = req.body;
    if (!name || !memberEmails)
      return res.status(400).json({ message: "Missing or wrong parameters" });
    if (memberEmails.length === 0)
      return res.status(400).json({ message: "No members" });
    const group = await Group.findOne({ name: name });
    if (group) 
    return res.status(401).json({ message: "Group already exists" });
    const members = [];
    const alreadyInGroup = [];
    const membersNotFound = [];
    const invalidEmails =[];
    for (const email of memberEmails) {
      // Check the format of input emails
      if (!isValidEmail(email)){
        // check the format of email
        if (!isValidEmail(email)) {
          invalidEmails.push(email);
          continue;
        }
      }
      const user = await User.findOne({ email: email });
      if (!user) {
        membersNotFound.push(email);
        continue;
      } else {
        const isInGroup = await Group.findOne({
          members: { $elemMatch: { email: email } },
        });
        if (isInGroup) {
          alreadyInGroup.push(email);
          continue;
        }
      }
      members.push({ email: email, user: user._id });
    }
    if (invalidEmails.length > 0) {
      return res.status(400).json({ data: invalidEmails, message: "Invalid email format" });
    }
    if (
      alreadyInGroup.length === memberEmails.length ||
      membersNotFound.length === memberEmails.length
    ) {
      return res.status(401).json({
        message: "All users already in group or none were found in system",
      });
    }
    const newGroup = await new Group({
      name: name,
      members: members,
    }).save();
    return res.status(200).json({data: { group: newGroup, alreadyInGroup: alreadyInGroup, 
      membersNotFound: membersNotFound}, refreshedTokenMessage: res.locals.refreshedTokenMessage });
  } 
  catch (err) {
    res.status(500).json(err.message);
  }
};


/**
 
- Request Parameters: None//// OK
- Request Body Content: None..OK
- Response `data` Content: An array of objects, each one having a string attribute for the `name` 
of the group and an array for the `members` of the group
  - Example: `res.status(200).json({data: [{name: "Family", members:
   [{email: "mario.red@email.com"}, {email: "luigi.red@email.com"}]}]
    refreshedTokenMessage: res.locals.refreshedTokenMessage})` 
- Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin)

 */
export const getGroups = async (req, res) => {
  try {
    // verify auth using utils function
    const Admin = verifyAuth(req, res, { authType: "Admin" });
    if (!Admin || !Admin.authorized){
      return res.status(401).json({ message: "Unauthorized" });
    }
    const groups = await Group.find().populate('members.user', 'email');
    const data = groups.map(group => {
      const members = group.members.map(member => ({
        email: member.email
      }));
      return { name: group.name, members };
    });

    res.status(200).json({ data ,refreshedTokenMessage: res.locals.refreshedTokenMessage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
- Request Parameters: A string equal to the `name` of the requested group
  - Example: `/api/groups/Family`
- Request Body Content: None
- Response `data` Content: An object having a string attribute for the `name` of the group and an array for the `members` of the group
  - Example: `res.status(200).json({data: {group: {name: "Family", members: [{email: "mario.red@email.com"},
   {email: "luigi.red@email.com"}]}} refreshedTokenMessage: res.locals.refreshedTokenMessage})`
- Returns a 400 error if the group name passed as a route parameter does not represent a group in the database
- Returns a 401 error if called by an authenticated user who is neither part of the group (authType = Group)
 nor an admin (authType = Admin)

 */
    export const getGroup = async (req, res) => {
        try {
          const groupname = req.params.name;
          const group = await Group.findOne({name : groupname});
          const admin = verifyAuth(req, res, { authType: "Admin" })
          const useremail = group.members.map(user => user.email);
          const user = verifyAuth(req, res, { authType: "Group" , emails:useremail});
          if (!user.authorized && !admin.authorized)
          return res.status(401).json({message: "User Unauthorized"}) ;
          if (!group) {
            return res.status(400).json({ error: 'Group does not exist' });
          }  
          res.status(200).json({data :{group :{groupname, members :[{email : group.members}]}},
            refreshedTokenMessage: res.locals.refreshedTokenMessage});
        } catch (error) {
          res.status(500).json({ error: error.message })
        }
      };
    

/**
  Request Parameters: A string equal to the `name` of the group
  - Example: `api/groups/Family/add` (user route)
  - Example: `api/groups/Family/insert` (admin route)
- Request Body Content: An array of strings containing the `emails` of the members to add to the group
  - Example: `{emails: ["pietro.blue@email.com"]}`
- Response `data` Content: An object having an attribute `group` (this object must have a string attribute for the `name` of the created group and an array for the `members` of the group, this array must include the new members as well as the old ones), an array that lists the `alreadyInGroup` members (members whose email is already present in a group) and an array that lists the `membersNotFound` (members whose email does not appear in the system)
  - Example: `res.status(200).json({data: {group: {name: "Family", members: [{email: "mario.red@email.com"}, 
  {email: "luigi.red@email.com"}, {email: "pietro.blue@email.com"}]}, membersNotFound: [], alreadyInGroup: []}
   refreshedTokenMessage: res.locals.refreshedTokenMessage})`
- In case any of the following errors apply then no user is added to the group
- Returns a 400 error if the request body does not contain all the necessary attributes
- Returns a 400 error if the group name passed as a route parameter does not 
represent a group in the database
- Returns a 400 error if all the provided emails represent users that are already in a group 
or do not exist in the database
- Returns a 400 error if at least one of the member emails is not in a valid email format
- Returns a 400 error if at least one of the member emails is an empty string
- Returns a 401 error if called by an authenticated user who is not part of the group
 (authType = Group) if the route is `api/groups/:name/add` -------
- Returns a 401 error if called by an authsenticated user who i not an admin (authType = Admin)
 if the route is `api/groups/:name/insert` ------
 */

    export const addToGroup = async (req, res) => {
      try {
        const groupName = req.params.name;
        const group = await Group.findOne({ name: groupName });
        const userRout = req.url.includes("/add");
        const adminRout = req.url.includes("/insert");
        if (adminRout){
          const Admin= verifyAuth(req, res, { authType: "Admin" });
          if (!Admin){
            return res.status(401).json({ message: "Unauthorized" }); 
          }
        }else if (userRout){
            const useremail = group.members.map(user => user.email);
            const user = verifyAuth(req, res, { authType: "Group" , email:useremail });
            if (!user){
              return res.status(401).json({ message: "Unauthorized" }); 
            }
          }else {
            return res.status(401).json({ message: "Unauthorized" }); 
          }
            const { emails } = req.body;
          if (!emails){ 
            return res.status(400).json({message: " Missing parameters"});
          }
        // Find group by params
        if (!group) {
          return res.status(400).json({ message: "Group does not exist. Create it first." });
        }        
        let alreadyInGroup = [];
        let membersNotFound = [];
        let notRegisteredUsers = [];
        const invalidEmails = [];
    
        for (const email of emails) {
          // check empty email 
          if (!email){
            return res.status(400).json({message: " Empty string. write correct email to add"});
          }
          // check the format of email
          if (!isValidEmail(email)) {
            invalidEmails.push(email);
            continue;
          }
          // Check for registration of emails
          const userIsRegistered = await User.findOne({ email: email });
          if (!userIsRegistered) {
            notRegisteredUsers.push(email);
            continue;
          }
          
            const groupMembers = await Group.findOne({ members: { $elemMatch: { email: email } },});
            if (groupMembers) {
              alreadyInGroup.push(email);
              continue;
            } 
            else {
              membersNotFound.push(email);
              group.members.push({ email: email });
            }
        }
        if(notRegisteredUsers.length>0){
          return res.status(400).json({data: notRegisteredUsers, 
            message:" These emails are not registered"});
        }
        if (alreadyInGroup.length >0 ){
        return res.status(400).json({data : alreadyInGroup, 
          message: "These Emails are already in  a group"});
        }
        if (invalidEmails.length > 0) {
        return res.status(400).json({ data: invalidEmails, message: "Invalid email format" });
        }
        
        // Save the updated group
        await group.save();
        const responseData = { group: { name: group.name, members: group.members,}, alreadyInGroup,
          membersNotFound,
          notRegisteredUsers,
        };
    
        res.status(200).json({ data: responseData , refreshedTokenMessage: res.locals.refreshedTokenMessage });
      
      } 
      catch (err) {
        res.status(500).json(err.message);
      }
    };
      
    



/**
 * Remove members from a group
- Request Parameters: A string equal to the `name` of the group
  - Example: `api/groups/Family/remove` (user route)
  - Example: `api/groups/Family/pull` (admin route)
- Request Body Content: An array of strings containing the `emails` of the members to remove from the group
  - Example: `{emails: ["pietro.blue@email.com"]}`
- Response `data` Content: An object having an attribute `group` (this object must have a string attribute for the `name` of the created group and an array for the `members` of the group, this array must include only the remaining members), an array that lists the `notInGroup` members (members whose email is not in the group) and an array that lists the `membersNotFound` (members whose email does not appear in the system)
  - Example: `res.status(200).json({data: {group: {name: "Family", members: [{email: "mario.red@email.com"}, {email: "luigi.red@email.com"}]}, membersNotFound: [], notInGroup: []} refreshedTokenMessage: res.locals.refreshedTokenMessage})`
- In case any of the following errors apply then no user is removed from the group
- Returns a 400 error if the request body does not contain all the necessary attributes
- Returns a 400 error if the group name passed as a route parameter does not represent a group in the database
- Returns a 400 error if all the provided emails represent users that do not belong to the group or do not exist in the database
- Returns a 400 error if at least one of the emails is not in a valid email format
- Returns a 400 error if at least one of the emails is an empty string
- Returns a 400 error if the group contains only one member before deleting any user
- Returns a 401 error if called by an authenticated user who is not part of the group (authType = Group) if the route is `api/groups/:name/remove`
- Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin) if the route is `api/groups/:name/pull`
 */
    export const removeFromGroup = async (req, res) => {
      try {
        const name = req.params.name;
        const groupCurrent = await Group.findOne({name: name});
        if(!groupCurrent){
          return res.status(400).json({error: "the group does not exist"})
        }

        const isAdminRoute = req.url.includes("/pull");
        const isPartOfTheGroup = req.url.includes("/remove");
        if(isAdminRoute){
          const adminAuth = verifyAuth(req, res, {authType: "Admin"});
          if(!adminAuth.authorized){
            return res.status(401).json({error: "unauthorized, only admins have access to this feature"})
          }
        }else if(isPartOfTheGroup){
          const emails1 = groupCurrent.members.map(a => a.email);
          const groupAuth = verifyAuth(req, res, {authType: "Group", emails: emails1})
          if(!groupAuth.authorized){

            return res.status(401).json({error: "unauthorized, the user must be part of the group in order to access this functionality"})
          }
        }else{
          return res.status(401).json({error: "unauthorized"});
        }

        const {emails} = req.body;
        if (!emails){
          return res.status(400).json({ error: "Missing or wrong parameters" });
        }

        if(groupCurrent.members.length === 1){
          return res.status(400).json({error: `only one member left in the group named ${name}, it is not possible to remove him`});
        }

        const notInGroup = [];
        const membersNotFound = [];
        const members = groupCurrent.members;
       
        for(const email of emails){
          if(!isValidEmail(email)){
            return res.status(400).json({error: `the email ${email} is not in a valid format`});
          }

          if(email.trim() === ""){
            return res.status(400).json({error: "empty string is not a valid email"});
          }
        }
    
        for(const email of emails){
          const user = await User.findOne({email: email});//checks if the current email is associated to any user
          if(!user){
            membersNotFound.push(email);//if the user does not exist
          }else{
            const check1 = members.find((object) => object.email === email); //if the user is present in the group
            if(!check1){
              notInGroup.push(email);
            }
          }
        }
        
        for(const email of emails){
          const userToRemove = members.find((object) => object.email === email);
          if(userToRemove){
            const cancelled = await Group.updateOne({name: name}, {$pull: {members: {email: userToRemove.email}}});
            //take the group, find the group corresponding to that name, check inside the members array if there is any object
            //which has that email (userToRemove); if you find it, you delte the object from the array
          }
        }

        const list = await Group.findOne({name: name}); // I need the current group updated
        const remainingMembers = list.members.map(a => a.email);
        
        if(emails.length === membersNotFound.length || emails.length === notInGroup.length || emails.length === (membersNotFound.length + notInGroup.length)){
          return res.status(400).json({error: "the requested members do not exist or they do not belong to the specified group"});
        }
    
        return res.json({data:{
          group: {
            name: name,
            members: remainingMembers
          },
          membersNotFound: membersNotFound,
          notInGroup: notInGroup
        }, refreshedTokenMessage: res.locals.refreshedTokenMessage
        });
    
      } catch (err) {
        res.status(500).json(err.message);
      }
    };

/**
 * Delete a user
- Request Parameters: None
- Request Body Content: A string equal to the `email` of the user to be deleted
  - Example: `{email: "luigi.red@email.com"}`
- Response `data` Content: An object having an attribute that lists the number of `deletedTransactions` and an attribute that specifies whether the user was also `deletedFromGroup` or not
  - Example: `res.status(200).json({data: {deletedTransaction: 1, deletedFromGroup: true}, refreshedTokenMessage: res.locals.refreshedTokenMessage})`
- If the user is the last user of a group then the group is deleted as well
- Returns a 400 error if the request body does not contain all the necessary attributes
- Returns a 400 error if the email passed in the request body is an empty string
- Returns a 400 error if the email passed in the request body is not in correct email format
- Returns a 400 error if the email passed in the request body does not represent a user in the database
- Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin) 
 */
export const deleteUser = async (req, res) => {

  try {

    const cookie = req.cookies;
    if (!cookie.accessToken || !cookie.refreshToken) {
      return res.status(401).json({ message: "Unauthorized" }); // unauthorized
    }

    // check if authenticated user is admin
    const isAdmin = verifyAuth(req, res, {authType:"Admin"})
    if(!isAdmin.authorized){
      return res.status(401).json({ message: isAdmin.cause }); // unauthorized
    }

    const { email } = req.body;

    // check if the request body does contain all the necessary attributes
    if (email===undefined) {
      return res.status(400).json({ error: 'email is missing' });
    }
  
    // check if the email passed in the request body is an empty string
    if (email.trim() === '') {
      return res.status(400).json({ error: 'email cannot be empty' });
    }

    // check if the email passed in the request body is in correct email format
    if(!isValidEmail(email)){
      return res.status(400).json({ error: 'email is not in correct form' });
    }

    const deletedUser = await User.findOneAndDelete({ email: req.body.email });

    // check if the email passed in the request body does represent a user in the database
    if(!deletedUser){
      return res.status(400).json({message: "email does not represent a user in the database"});
    }

    // check if the user to delete is an Admin
    if(deletedUser.role == "Admin"){
      return res.status(400).json({message: "user to delete cannot be admin"});
    }

    const userTransactions = await transactions.find({
        username: deletedUser.username
    });

    const idList = userTransactions.map(transaction => transaction._id);

    const deletedTransactions = await transactions.deleteMany({ _id: { $in: idList } });

    const userGroup = await Group.findOne({ 'members.email': email });
    let deletedFromGroup = null
    if (!userGroup){
      deletedFromGroup = false
    }
    else{
      if(userGroup.members.length==1){
        await Group.deleteOne({ _id: userGroup._id })
      }
      else{
        await Group.updateOne({_id: userGroup._id}, {$pull: {members: {email: email}}});
      }      
      deletedFromGroup = true
    }

    return res.status(200).json({data: {deletedTransaction: deletedTransactions.deletedCount, deletedFromGroup: deletedFromGroup}, refreshedTokenMessage: res.locals.refreshedTokenMessage})

  } catch (error) {
    return res.status(500).json({ message: "Error" });
  }
};

/**
 * Delete a group
- Request Parameters: None
- Request Body Content: A string equal to the `name` of the group to be deleted
  - Example: `{name: "Family"}`
- Response `data` Content: A message confirming successful deletion
  - Example: `res.status(200).json({data: {message: "Group deleted successfully"} , refreshedTokenMessage: res.locals.refreshedTokenMessage})`
- Returns a 400 error if the request body does not contain all the necessary attributes
- Returns a 400 error if the name passed in the request body is an empty string
- Returns a 400 error if the name passed in the request body does not represent a group in the database
- Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin)
 */
export const deleteGroup = async (req, res) => {
  try {
    const adminAuth = verifyAuth(req, res, {authType: "Admin"});
    if(!adminAuth.authorized){
      return res.status(401).json({error: "unauthorised, only admins have access this feature"})
    }
    
    const {name} = req.body;
    if(!name){
      return res.status(400).json({error: "missing parameters"})
    }
    if(typeof name !== "string"){
      return res.status(400).json({error: "invalid name"});
    }
    if(name.trim() === ""){
      return res.status(400).json({error: "empty string is not a valid group"})
    }
    const group = await Group.deleteOne({name: name});
    if(group.deletedCount === 0){
      return res.status(400).json({error: "the group does not exist"});
    }

    return res.json({data: {error: "the group has been correctly deleted"}});
    
  } catch (err) {
    res.status(500).json(err.message);
  }
};