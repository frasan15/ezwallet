import { Group, User } from "../models/User.js";
import { transactions } from "../models/model.js";
import { verifyAuth } from "./utils.js";
import { getAllTransactions } from "./controller.js";

/**
 * Return all the users
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having attributes `username`, `email` and `role`
  - Optional behavior:
    - empty array is returned if there are no users
 */
export const getUsers = async (req, res) => {
  try {

    const cookie = req.cookies;
    if (!cookie.accessToken) {
      return res.status(401).json({ message: "Unauthorized" }); // unauthorized
    }

    // check if user is admin

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
 * Create a new group
  - Request Body Content: An object having a string attribute for the `name` of the group and an array that lists all the `memberEmails`
  - Response `data` Content: An object having an attribute `group` (this object must have a string attribute for the `name`
    of the created group and an array for the `members` of the group), an array that lists the `alreadyInGroup` members
    (members whose email is already present in a group) and an array that lists the `membersNotFound` (members whose email
    +does not appear in the system)
  - Optional behavior:
    - error 401 is returned if there is already an existing group with the same name
    - error 401 is returned if all the `memberEmails` either do not exist or are already in a group
 */
export const createGroup = async (req, res) => {
  try {
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
    for (const email of memberEmails) {
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
 * Return all the groups
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having a string attribute for the `name` of the group
    and an array for the `members` of the group
  - Optional behavior:
    - empty array is returned if there are no groups
 */
export const getGroups = async (req, res) => {
  try {
    // verify auth using utils function
    const user = await verifyAuth(req, res);
    if (!user || !user.authorized)
      return res.status(401).json({ message: "Unauthorized" });
    const groups = await Group.find();
    res.json({ data: groups, message: "Success" });
  } catch (err) {
    res.status(500).json(err.message);
  }
};

/**
 * Return information of a specific group
  - Request Body Content: None
  - Response `data` Content: An object having a string attribute for the `name` of the group and an array for the 
    `members` of the group
  - Optional behavior:
    - error 401 is returned if the group does not exist
 */
export const getGroup = async (req, res) => {
  try {
  } catch (err) {
    res.status(500).json(err.message);
  }
};

/**
 * Add new members to a group
  - Request Body Content: An array of strings containing the emails of the members to add to the group
  - Response `data` Content: An object having an attribute `group` (this object must have a string attribute for the `name` of the
    created group and an array for the `members` of the group, this array must include the new members as well as the old ones), 
    an array that lists the `alreadyInGroup` members (members whose email is already present in a group) and an array that lists 
    the `membersNotFound` (members whose email does not appear in the system)
  - Optional behavior:
    - error 401 is returned if the group does not exist
    - error 401 is returned if all the `memberEmails` either do not exist or are already in a group
 */
export const addToGroup = async (req, res) => {
  try {
  } catch (err) {
    res.status(500).json(err.message);
  }
};

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
    // check if user is admin
    // check if email is in correct form

    const { email } = req.body;

    if (email===null || email===undefined) {
      return res.status(400).json({ error: 'email is missing' });
    }
  
    if (email.trim() === '') {
      return res.status(400).json({ error: 'email cannot be empty' });
    }

    const deletedUser = await User.findOneAndDelete({ email: req.body.email });

    if(!deletedUser){
      return res.status(400).json({message: "email does not represent a user in the database"});
    }

    const userTransactions = await transactions.find({
        username: deletedUser.username
    });

    const idList = userTransactions.map(transaction => transaction._id);

    const deletedTransactions = await transactions.deleteMany({ _id: { $in: idList } });

    // check if user is in a group

    return res.status(200).json({data: {deletedTransaction: deletedTransactions.deletedCount, deletedFromGroup: true}, refreshedTokenMessage: res.locals.refreshedTokenMessage})

  } catch (error) {
    return res.status(500).json({ message: "Error" });
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
