import { Group, User } from "../models/User.js";
import { transactions } from "../models/model.js";
import { verifyAuth } from "./utils.js";


// This function checks the format of input Emails 
const isValidEmail = (email) => {
  const emailformat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailformat.test(email);
};



/**
 * Return all the users
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having attributes `username`, `email` and `role`
  - Optional behavior:
    - empty array is returned if there are no users
 */
export const getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json(error.message);
  }
};

/**
 * Return information of a specific user
  - Request Body Content: None
  - Response `data` Content: An object having attributes `username`, `email` and `role`.
  - Optional behavior:
    - error 401 is returned if the user is not found in the system
 */
export const getUser = async (req, res) => {
  try {
    const cookie = req.cookies;
    if (!cookie.accessToken || !cookie.refreshToken) {
      return res.status(401).json({ message: "Unauthorized" }); // unauthorized
    }
    const username = req.params.username;
    const user = await User.findOne({ refreshToken: cookie.refreshToken });
    if (!user) return res.status(401).json({ message: "User not found" });
    if (user.username !== username)
      return res.status(401).json({ message: "Unauthorized" });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json(error.message);
  }
};

/**
    - Request Parameters: None
- Request request body Content: An object having a string attribute for the `name` of the group
 and an array that lists all the `memberEmails`
  - Example: `{name: "Family", memberEmails: ["mario.red@email.com", "luigi.red@email.com"]}`
- Response `data` Content: An object having an attribute `group` (this object must have a string 
  attribute for the `name` of the created group and an array for the `members` of the group),
   an array that lists the `alreadyInGroup` members (members whose email is already present in a 
    group) and an array that lists the `membersNotFound` (members whose email does not appear in the
   system)
  - Example: `res.status(200).json({data: {group: {name: "Family", members: [{email: "mario.red@email.com"}, {email: "luigi.red@email.com"}]}, membersNotFound: [], alreadyInGroup: []} refreshedTokenMessage: res.locals.refreshedTokenMessage})`
- If the user who calls the API does not have their email in the list of emails 
then their email is added to the list of members
- Returns a 400 error if the request body does not contain all the necessary attributes
- Returns a 400 error if the group name passed in the request body is an empty string
- Returns a 400 error if the group name passed in the request body represents an already
 existing group in the database
- Returns a 400 error if all the provided emails represent users that are already in a group
 or do not exist in the database
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
    if (group) return res.status(401).json({ message: "Group already exists" });
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
    return res.json({
      data: {
        group: newGroup,
        alreadyInGroup: alreadyInGroup,
        membersNotFound: membersNotFound,
      },
      message: "Success",
    });
  } catch (err) {
    res.status(500).json(err.message);
  }
};


/**
 Request Parameters: None
- Request Body Content: None
- Response `data` Content: An array of objects, each one having a string attribute for the `name`
 of the group and an array for the `members` of the group
  - Example: `res.status(200).json({data: [{name: "Family", members: [{email: "mario.red@email.com"}, {email: "luigi.red@email.com"}]}] refreshedTokenMessage: res.locals.refreshedTokenMessage})`
- Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin)
 */

export const getGroups = async (req, res) => {
  try {
    // verify auth using utils function
    const user = verifyAuth(req, res, {authType: "Admin"});
    if (!user || !user.authorized)
      return res.status(401).json({ message: "Unauthorized" });
    const groups = await Group.find();
    res.json({ data: groups, message: "Success" });
  } catch (err) {
    res.status(500).json(err.message);
  }
}



/**
 Request Parameters: A string equal to the `name` of the requested group
  - Example: `/api/groups/Family`
- Request Body Content: None
- Response `data` Content: An object having a string attribute for the `name` of the group
 and an array for the `members` of the group
  - Example: `res.status(200).json({data: {group: {name: "Family", members: [{email: "mario.red@email.com"}, {email: "luigi.red@email.com"}]}} refreshedTokenMessage: res.locals.refreshedTokenMessage})`
- Returns a 400 error if the group name passed as a route parameter does not represent a group 
in the database
- Returns a 401 error if called by an authenticated user who is neither part of the group
 (authType = Group) nor an admin (authType = Admin)

 */
    export const getGroup = async (req, res) => {
        try {
          const user = verifyAuth(req, res, { authType: "Group", username: req.params.username });
          if (user.authorized) {
            //User auth successful
            const groupname = req.params.name;
            const group = await Group.findOne({name : groupname});
             if (!group) {
          return res.status(400).json({ error: 'Group does not exist' });
        }
          res.status(200).json({ data: { name: group.name, members: group.members } });

          } else {
            const adminAuth = verifyAuth(req, res, { authType: "Admin" })
            if (adminAuth.authorized) {
              //Admin auth successful
              const groupname = req.params.name;
        const group = await Group.findOne({name : groupname});
        if (!group) {
          return res.status(400).json({ error: 'Group does not exist' });
        }
          res.status(200).json({ data: { name: group.name, members: group.members } });
            } else {
              res.status(401).json({ error: adminAuth.cause})
            }
          }
        } catch (error) {
          res.status(500).json({ error: error.message })
        }
      }
    

/**
  Request Parameters: A string equal to the `name` of the group
  - Example: `api/groups/Family/add` (user route)
  - Example: `api/groups/Family/insert` (admin route)
- Request Body Content: An array of strings containing the `emails` of the members to add to the group
  - Example: `{emails: ["pietro.blue@email.com"]}`
- Response `data` Content: An object having an attribute `group` (this object must have a string attribute for the `name` of the created group and an array for the `members` of the group, this array must include the new members as well as the old ones), an array that lists the `alreadyInGroup` members (members whose email is already present in a group) and an array that lists the `membersNotFound` (members whose email does not appear in the system)
  - Example: `res.status(200).json({data: {group: {name: "Family", members: [{email: "mario.red@email.com"}, {email: "luigi.red@email.com"}, {email: "pietro.blue@email.com"}]}, membersNotFound: [], alreadyInGroup: []} refreshedTokenMessage: res.locals.refreshedTokenMessage})`
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
        const user = verifyAuth(req, res, { authType: "Group", username: req.params.username });
          if (!user || !user.authorized) 
            return res.status(401).json({ message: "Unauthorized" });
            const { memberEmails } = req.body;
          if (!memberEmails){
            return res.status(400).json({message: " Missing parameters"});
          }
        // Find group by params
        const groupName = req.params.name;
        const group = await Group.findOne({ name: groupName });
        if (!group) {
          return res.status(401).json({ message: "Group does not exist. Create it first." });
        }
         // let groupMembers = group.members.map((member) => member.email);
        
        let alreadyInGroup = [];
        let membersNotFound = [];
        let notRegisteredUsers = [];
        const invalidEmails = [];
    
        for (const email of memberEmails) {
          // check empty email 
          if (!email) {
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
    
        res.json({ data: responseData });
      } 
      catch (err) {
        res.status(500).json(err.message);
      }
    }
      
    



/**
 * Remove members from a group
  - Request Body Content: An object having an attribute `group` (this object must have a string attribute for the `name` of the
    created group and an array for the `members` of the group, this array must include only the remaining members),
    an array that lists the `notInGroup` members (members whose email is not in the group) and an array that lists 
    the `membersNotFound` (members whose email does not appear in the system)
  - Optional behavior:
    - error 401 is returned if the group does not exist
    - error 401 is returned if all the `memberEmails` either do not exist or are not in the group
 */
export const removeFromGroup = async (req, res) => {
  try {
  } catch (err) {
    res.status(500).json(err.message);
  }
};

/**
 * Delete a user
  - Request Parameters: None
  - Request Body Content: A string equal to the `email` of the user to be deleted
  - Response `data` Content: An object having an attribute that lists the number of `deletedTransactions` and a boolean attribute that
    specifies whether the user was also `deletedFromGroup` or not.
  - Optional behavior:
    - error 401 is returned if the user does not exist 
 */
export const deleteUser = async (req, res) => {
  try {
  } catch (err) {
    res.status(500).json(err.message);
  }
};

/**
 * Delete a group
  - Request Body Content: A string equal to the `name` of the group to be deleted
  - Response `data` Content: A message confirming successful deletion
  - Optional behavior:
    - error 401 is returned if the group does not exist
 */
export const deleteGroup = async (req, res) => {
  try {
  } catch (err) {
    res.status(500).json(err.message);
  }
};
