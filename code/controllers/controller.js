import { categories, transactions } from "../models/model.js";
import { Group, User } from "../models/User.js";
import {
  handleDateFilterParams,
  handleAmountFilterParams,
  verifyAuth,
} from "./utils.js";
import mongoose from "mongoose";

/**
 * 
- Request Parameters: None
- Request Body Content: An object having attributes `type` and `color`
  - Example: `{type: "food", color: "red"}`
- Response `data` Content: An object having attributes `type` and `color`
  - Example: `res.status(200).json({data: {type: "food", color: "red"}, refreshedTokenMessage: res.locals.refreshedTokenMessage})`
- Returns a 400 error if the request body does not contain all the necessary attributes
- Returns a 400 error if at least one of the parameters in the request body is an empty string
- Returns a 400 error if the type of category passed in the request body represents an already existing category in the database
- Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin)
 */
export const createCategory = async (req, res) => {
    try {
        const Admin = verifyAuth(req, res, { authType: "Admin" });
        if (!Admin.authorized) 
          return res.status(401).json({error: "Unauthorized" }) // unauthorized
        const { type, color } = req.body;
        if (!type || !color)
          return res.status(400).json({error: "Missing or wrong parameters"});
        if (type.trim() === "" || color.trim() === "")
          return res.status(400).json({error: "empty string not acceptable"});
        const category = await categories.findOne({type: type});
        if (category) 
          return res.status(400).json({error: "category already exist"})
        const new_categories =await new categories({ type: type, color:color }).save();
        return res.status(200).json({data :{type: new_categories.type, color: new_categories.color} , refreshedTokenMessage: res.locals.refreshedTokenMessage});
        }
        catch (error) {
        res.status(500).json({ error: error.message })
    }
};

/**
 * Edit a category's type or color
- Request Parameters: A string equal to the `type` of the category that must be edited
  - Example: `api/categories/food`
- Request Body Content: An object having attributes `type` and `color` equal to the new values to assign to the category
  - Example: `{type: "Food", color: "yellow"}`
- Response `data` Content: An object with parameter `message` that confirms successful editing and a parameter `count` that is equal to the count of transactions whose category was changed with the new type
  - Example: `res.status(200).json({data: {message: "Category edited successfully", count: 2}, refreshedTokenMessage: res.locals.refreshedTokenMessage})`
- In case any of the following errors apply then the category is not updated, and transactions are not changed
- Returns a 400 error if the request body does not contain all the necessary attributes
- Returns a 400 error if at least one of the parameters in the request body is an empty string
- Returns a 400 error if the type of category passed as a route parameter does not represent a category in the database
- Returns a 400 error if the type of category passed in the request body as the new type represents an already existing category in the database
- Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin)
 */
export const updateCategory = async (req, res) => {
  try {
    const cookie = req.cookies;
    const adminAuth = verifyAuth(req, res, { authType: "Admin" });
    if (!adminAuth.authorized) {
      return res
        .status(401)
        .json({ error: "unauthorised, only admins have access this feature" });
    }

    let { type, color } = req.body;
    let type1 = typeof type;
    let color1 = typeof color;

    if (
      type1 !== "string" ||
      color1 !== "string" ||
      !type ||
      !color ||
      type.trim() === "" ||
      color.trim() === ""
    ) {
      return res
        .status(400)
        .json({ error: "the parameters have invalid values" });
    }

    const typeAlreadyPresent = await categories.findOne({ type: type });
    if (typeAlreadyPresent) {
      return res.status(400).json({
        error:
          "the type of category passed in the request body as the new type represents an already existing category in the database",
      });
    }

    const modified = await categories.updateOne(
      { type: req.params.type },
      { $set: { type: type, color: color } }
    );

    if (modified.modifiedCount === 0) {
      return res
        .status(400)
        .json({ error: "the specified category does not exist" });
    }

    const data = await transactions.updateMany(
      { type: req.params.type },
      { $set: { type: type } }
    );
    const result = {
      data: { count: data.modifiedCount, message: "succesfull updating" },
      refreshedTokenMessage: res.locals.refreshedTokenMessage,
    };

    return res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Delete a category
- Request Parameters: None
- Request Body Content: An array of strings that lists the `types` of the categories to be deleted
  - Example: `{types: ["health"]}`
- Response `data` Content: An object with an attribute `message` that confirms successful deletion and an attribute `count` that specifies the number of transactions that have had their category type changed
  - Example: `res.status(200).json({data: {message: "Categories deleted", count: 1}, refreshedTokenMessage: res.locals.refreshedTokenMessage})`
- Given N = categories in the database and T = categories to delete:
  - If N > T then all transactions with a category to delete must have their category set to the oldest category that is not in T
  - If N = T then the oldest created category cannot be deleted and all transactions must have their category set to that category
- In case any of the following errors apply then no category is deleted
- Returns a 400 error if the request body does not contain all the necessary attributes
- Returns a 400 error if called when there is only one category in the database
- Returns a 400 error if at least one of the types in the array is an empty string
- Returns a 400 error if at least one of the types in the array does not represent a category in the database
- Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin)
 */
export const deleteCategory = async (req, res) => {
  try {
    const adminAuth = verifyAuth(req, res, { authType: "Admin" });
    if (!adminAuth.authorized) {
      return res.status(401).json({
        error: "unauthorised, only admins have access to this feature",
      });
    }

    let count = 0;
    const { types } = req.body;

    if (!types) {
      return res.status(400).json({ error: "missing parameters" });
    }

    if ((await categories.count()) === 1) {
      return res.status(400).json({
        error:
          "there is only one category left, it is not possible to remove it",
      });
    }

    for (const i of types) {
      if (i.trim() === "") {
        return res
          .status(400)
          .json({ error: "empty string is not a valid type" });
      }
      const check1 = await categories.findOne({ type: i });
      if (check1 === null) {
        return res
          .status(400)
          .json({ error: `the category ${i} does not exist` });
      }
    }
    let lastCategory = "";
    const N = await categories.count();
    const T = types.length;
    if (N === T) {
      lastCategory = await categories.findOne(); //the lastFunction is found only whene N === T
    }

    for (const i of types) {
      if (i === lastCategory.type) {
        //if N === T and the lastCategory is supposed to be deleted, then it will be not, but all
        //other categories will be
        continue;
      }

      const cancelled = await categories.deleteOne({ type: i });
      const a = await categories.findOne({}, { _id: 0, type: 1 });

      const transaction_changed = await transactions.updateMany(
        { type: i },
        { $set: { type: a.type } }
      );
      count += transaction_changed.modifiedCount;
    }

    const result = {
      data: { message: "categories correctly deleted", count: count },
      refreshedTokenMessage: res.locals.refreshedTokenMessage,
    };
    return res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * 
- Request Parameters: None
- Request Body Content: None
- Response `data` Content: An array of objects, each one having attributes `type` and `color`
  - Example: `res.status(200).json({data: [{type: "food", color: "red"}, {type: "health", color: "green"}], refreshedTokenMessage: res.locals.refreshedTokenMessage})`
- Returns a 401 error if called by a user who is not authenticated (authType = Simple)

 */
export const getCategories = async (req, res) => {
    try {
        const user = verifyAuth(req, res, { authType: "Simple" })
        if (!user || !user.authorized)
        return res.status(401).json({error: "Unauthorized"})
        let data = await categories.find({})
        let filter = data.map(v => Object.assign({}, { type: v.type, color: v.color }))
        return res.status(200).json({ data: filter, refreshedTokenMessage: res.locals.refreshedTokenMessage })
    } 
    catch (error) {
        res.status(500).json({ error: error.message })
    }
};


/**
 * Create a new transaction made by a specific user
- Request Parameters: A string equal to the `username` of the involved user
  - Example: `/api/users/Mario/transactions`
- Request Body Content: An object having attributes `username`, `type` and `amount`
  - Example: `{username: "Mario", amount: 100, type: "food"}`
- Response `data` Content: An object having attributes `username`, `type`, `amount` and `date`
  - Example: `res.status(200).json({data: {username: "Mario", amount: 100, type: "food", date: "2023-05-19T00:00:00"}, refreshedTokenMessage: res.locals.refreshedTokenMessage})`
- Returns a 400 error if the request body does not contain all the necessary attributes
- Returns a 400 error if at least one of the parameters in the request body is an empty string
- Returns a 400 error if the type of category passed in the request body does not represent a category in the database
- Returns a 400 error if the username passed in the request body is not equal to the one passed as a route parameter
- Returns a 400 error if the username passed in the request body does not represent a user in the database
- Returns a 400 error if the username passed as a route parameter does not represent a user in the database
- Returns a 400 error if the amount passed in the request body cannot be parsed as a floating value (negative numbers are accepted)
- Returns a 401 error if called by an authenticated user who is not the same user as the one in the route parameter (authType = User)
 */
export const createTransaction = async (req, res) => {
  try {
    const shouldReturn = await searchUserAndCheckAdmin(req, res, false);
    if (shouldReturn) return;
    const { username, amount, type } = req.body;
    if (!username || !amount || !type) {
      return res.status(400).json({
        message: "Bad request: missing parameters",
      });
    }
    if (username === "" || amount === "" || type === "") {
      return res.status(400).json({
        message: "Bad request: empty string is not a valid parameter",
      });
    }
    if (typeof amount !== "number") {
      return res.status(400).json({
        message: "Amount must be a number",
      });
    }
    let floatAmount = Number(amount);
    if (isNaN(floatAmount)) {
      return res.status(400).json({
        message: "Error parsing amount",
      });
    }
    const user = await User.findOne({ username: username });
    if (!user) {
      return res
        .status(401)
        .json({ message: "Username in transaction does not exist" });
    }
    const category = await categories.findOne({ type: type });
    if (!category) {
      return res.status(401).json({ message: "Category does not exist" });
    }
    const new_transactions = new transactions({ username, amount, type });
    new_transactions
      .save()
      .then((data) => res.json(data))
      .catch((err) => {
        throw err;
      });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Return all transactions made by all users
- Request Parameters: None
- Request Body Content: None
- Response `data` Content: An array of objects, each one having attributes `username`, `type`, `amount`, `date` and `color`
  - Example: `res.status(200).json({data: [{username: "Mario", amount: 100, type: "food", date: "2023-05-19T00:00:00", color: "red"}, {username: "Mario", amount: 70, type: "health", date: "2023-05-19T10:00:00", color: "green"}, {username: "Luigi", amount: 20, type: "food", date: "2023-05-19T10:00:00", color: "red"} ], refreshedTokenMessage: res.locals.refreshedTokenMessage})`
- Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin)
 */
export const getAllTransactions = async (req, res) => {
  try {
    const shouldReturn = await searchUserAndCheckAdmin(req, res, true);
    if (shouldReturn) return;
    /**
     * MongoDB equivalent to the query "SELECT * FROM transactions, categories WHERE transactions.type = categories.type"
     */
    transactions
      .aggregate([
        {
          $lookup: {
            from: "categories",
            localField: "type",
            foreignField: "type",
            as: "categories_info",
          },
        },
        { $unwind: "$categories_info" },
      ])
      .then((result) => {
        if (result.length == 0)
          return res.json({
            data: [],
            message: "No transactions found",
          });
        let data = result.map((v) =>
          Object.assign(
            {},
            {
              _id: v._id,
              username: v.username,
              amount: v.amount,
              type: v.type,
              color: v.categories_info.color,
              date: v.date,
            }
          )
        );
        res.json(data);
      })
      .catch((error) => {
        throw error;
      });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const searchUserAndCheckAdmin = async (req, res, isAdminRoute) => {
  const isAdmin = verifyAuth(req, res, { authType: "Admin" });
  const isSameUser = verifyAuth(req, res, {
    authType: "User",
    username: req.params.username,
  });

  if (isAdminRoute && !isAdmin.authorized) {
    res.status(401).json({ message: isAdmin.cause });
    return true;
  }

  if (!isAdminRoute && !isSameUser.authorized) {
    res.status(401).json({ message: isSameUser.cause });
    return true;
  }
  if (req.params.username) {
    const user = await User.findOne({ username: req.params.username });
    if (!user) {
      res.status(400).json({
        message: "User not found",
      });
      return true;
    }
  }
  return false;
};

const commonTransactionsByUser = async (req, res, filter) => {
  const match = req.params.category
  ? { "categories_info.type": req.params.category }
  : {};
  filter.amount ? (match.amount = filter.amount) : null;
  filter.date ? (match.date = filter.date) : null;
  const allTransactions = await transactions.aggregate([
    {
      $match: {
        username: req.params.username,
      },
    },
    {
      $lookup: {
        from: "categories",
        localField: "type",
        foreignField: "type",
        as: "categories_info",
      },
    },
    { $unwind: "$categories_info" },
    {
      $match: match,
    },
    { $addFields: { color: "$categories_info.color" } },
    { $project: { categories_info: 0, __v: 0 } },
  ]);
  if (allTransactions.length == 0) {
    return res.json({
      data: [],
      message: "No transactions found",
    });
  }
  res.json({
    data: allTransactions,
    message: "Success",
  });
};

/**
 * Return all transactions made by a specific user
- Request Parameters: A string equal to the `username` of the involved user
  - Example: `/api/users/Mario/transactions` (user route)
  - Example: `/api/transactions/users/Mario` (admin route)
- Request Body Content: None
- Response `data` Content: An array of objects, each one having attributes `username`, `type`, `amount`, `date` and `color`
  - Example: `res.status(200).json({data: [{username: "Mario", amount: 100, type: "food", date: "2023-05-19T00:00:00", color: "red"}, {username: "Mario", amount: 70, type: "health", date: "2023-05-19T10:00:00", color: "green"} ] refreshedTokenMessage: res.locals.refreshedTokenMessage})`
- Returns a 400 error if the username passed as a route parameter does not represent a user in the database
- Returns a 401 error if called by an authenticated user who is not the same user as the one in the route (authType = User) if the route is `/api/users/:username/transactions`
- Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin) if the route is `/api/transactions/users/:username`
- Can be filtered by date and amount if the necessary query parameters are present and if the route is `/api/users/:username/transactions`
 */
export const getTransactionsByUser = async (req, res) => {
  try {
    //Distinction between route accessed by Admins or Regular users for functions that can be called by both
    //and different behaviors and access rights
    const isAdminRoute = req.url.includes("/transactions/users/");
    const shouldReturn = await searchUserAndCheckAdmin(req, res, isAdminRoute);
    if (shouldReturn) return;
    let filter = {};
    if (!isAdminRoute) {
      const filter1 = handleAmountFilterParams(req, res);
      const filter2 = handleDateFilterParams(req, res);
      filter = Object.assign(filter1, filter2);
    }
    commonTransactionsByUser(req, res, filter);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Return all transactions made by a specific user filtered by a specific category
- The behavior defined below applies only for the specified route
- Request Parameters: A string equal to the `username` of the involved user, a string equal to the requested `category`
  - Example: `/api/users/Mario/transactions/category/food` (user route)
  - Example: `/api/transactions/users/Mario/category/food` (admin route)
- Request Body Content: None
- Response `data` Content: An array of objects, each one having attributes `username`, `type`, `amount`, `date` and `color`, filtered so that `type` is the same for all objects
  - Example: `res.status(200).json({data: [{username: "Mario", amount: 100, type: "food", date: "2023-05-19T00:00:00", color: "red"} ] refreshedTokenMessage: res.locals.refreshedTokenMessage})`
- Returns a 400 error if the username passed as a route parameter does not represent a user in the database
- Returns a 400 error if the category passed as a route parameter does not represent a category in the database
- Returns a 401 error if called by an authenticated user who is not the same user as the one in the route (authType = User) if the route is `/api/users/:username/transactions/category/:category`
- Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin) if the route is `/api/transactions/users/:username/category/:category`
 */
export const getTransactionsByUserByCategory = async (req, res) => {
  try {
    if (!req.params.category) {
      return res.status(400).json({
        message: "Category invalid",
      });
    }
    const category = await categories.findOne({ type: req.params.category });
    if (!category) {
      return res.status(401).json({
        message: "Category not found",
      });
    }
    const isAdminRoute = req.url.includes("/transactions/users/");
    const shouldReturn = await searchUserAndCheckAdmin(req, res, isAdminRoute);
    if (shouldReturn) return;
    commonTransactionsByUser(req, res);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const searchGroupAndCheckAdmin = async (req, res, checkAdmin) => {
  if (!req.params.name) {
    res.status(400).json({
      message: "Group invalid",
    });
    return true;
  }
  const group = await Group.findOne({ username: req.params.name });
  if (!group) {
    res.status(401).json({
      message: "Group not found",
    });
    return true;
  }
  if (checkAdmin) {
    const adminAuth = verifyAuth(req, res, { authType: "Admin" });
    if (!adminAuth.authorized) {
      res.status(401).json({ message: adminAuth.cause });
      return true;
    }
  }
  return false;
};

const commonTransactionsByGroup = async (req, res, isAdmin) => {
  const allTransactions = [];
  const group = await Group.findOne({ name: req.params.name });
  if (!isAdmin) {
    // if user is not admin, check if user is in group
    const userWhoMadeRequest = await User.findOne({
      refreshToken: req.cookies.refreshToken,
    });
    const isUserInGroup =
      group.members.findIndex(
        (member) => member.email == userWhoMadeRequest.email
      ) == -1;
    if (isUserInGroup) {
      return res.status(401).json({
        message: "User is not in the group",
      });
    }
  }
  for (const member of group.members) {
    const user = await User.findOne({ email: member.email });
    const singleUserTransactions = await transactions.aggregate([
      {
        $match: {
          username: user.username,
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "type",
          foreignField: "type",
          as: "categories_info",
        },
      },
      { $unwind: "$categories_info" },
      {
        $match: req.params.category
          ? { "categories_info.type": req.params.category }
          : {},
      },
      { $addFields: { color: "$categories_info.color" } },
      { $project: { categories_info: 0, __v: 0 } },
    ]);
    if (singleUserTransactions.length !== 0) {
      allTransactions.push(...singleUserTransactions);
    }
  }
  return res.json({
    data: allTransactions,
    message: "Success",
  });
};

/**
 * Return all transactions made by members of a specific group
- Request Parameters: A string equal to the `name` of the requested group
  - Example: `/api/groups/Family/transactions` (user route)
  - Example: `/api/transactions/groups/Family` (admin route)
- Request Body Content: None
- Response `data` Content: An array of objects, each one having attributes `username`, `type`, `amount`, `date` and `color`
  - Example: `res.status(200).json({data: [{username: "Mario", amount: 100, type: "food", date: "2023-05-19T00:00:00", color: "red"}, {username: "Mario", amount: 70, type: "health", date: "2023-05-19T10:00:00", color: "green"}, {username: "Luigi", amount: 20, type: "food", date: "2023-05-19T10:00:00", color: "red"} ] refreshedTokenMessage: res.locals.refreshedTokenMessage})`
- Returns a 400 error if the group name passed as a route parameter does not represent a group in the database
- Returns a 401 error if called by an authenticated user who is not part of the group (authType = Group) if the route is `/api/groups/:name/transactions`
- Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin) if the route is `/api/transactions/groups/:name`
 */
export const getTransactionsByGroup = async (req, res) => {
  try {
    const isAdminRoute = req.url.includes("/transactions/groups");
    const shouldReturn = await searchGroupAndCheckAdmin(req, res, isAdminRoute);
    if (shouldReturn) return;
    commonTransactionsByGroup(req, res, isAdminRoute);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Return all transactions made by members of a specific group filtered by a specific category
- Request Parameters: A string equal to the `name` of the requested group, a string equal to the requested `category`
  - Example: `/api/groups/Family/transactions/category/food` (user route)
  - Example: `/api/transactions/groups/Family/category/food` (admin route)
- Request Body Content: None
- Response `data` Content: An array of objects, each one having attributes `username`, `type`, `amount`, `date` and `color`, filtered so that `type` is the same for all objects.
  - Example: `res.status(200).json({data: [{username: "Mario", amount: 100, type: "food", date: "2023-05-19T00:00:00", color: "red"}, {username: "Luigi", amount: 20, type: "food", date: "2023-05-19T10:00:00", color: "red"} ] refreshedTokenMessage: res.locals.refreshedTokenMessage})`
- Returns a 400 error if the group name passed as a route parameter does not represent a group in the database
- Returns a 400 error if the category passed as a route parameter does not represent a category in the database
- Returns a 401 error if called by an authenticated user who is not part of the group (authType = Group) if the route is `/api/groups/:name/transactions/category/:category`
- Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin) if the route is `/api/transactions/groups/:name/category/:category`
 */
export const getTransactionsByGroupByCategory = async (req, res) => {
  try {
    if (!req.params.category) {
      return res.status(400).json({
        message: "Category invalid",
      });
    }
    const category = await categories.findOne({ type: req.params.category });
    if (!category) {
      return res.status(401).json({
        message: "Category not found",
      });
    }
    const isAdminRoute = req.url.includes("/transactions/groups");
    const shouldReturn = await searchGroupAndCheckAdmin(req, res, isAdminRoute);
    if (shouldReturn) return;
    commonTransactionsByGroup(req, res, isAdminRoute);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Delete a transaction made by a specific user
- Request Parameters: A string equal to the `username` of the involved user
  - Example: `/api/users/Mario/transactions`
- Request Body Content: The `_id` of the transaction to be deleted
  - Example: `{_id: "6hjkohgfc8nvu786"}`
- Response `data` Content: A string indicating successful deletion of the transaction
  - Example: `res.status(200).json({data: {message: "Transaction deleted"}, refreshedTokenMessage: res.locals.refreshedTokenMessage})`
- Returns a 400 error if the request body does not contain all the necessary attributes
- Returns a 400 error if the username passed as a route parameter does not represent a user in the database
- Returns a 400 error if the `_id` in the request body does not represent a transaction in the database
- Returns a 400 error if the transaction to delete has not been made by the user who calls the function
- Returns a 401 error if called by an authenticated user who is not the same user as the one in the route (authType = User)
 */
export const deleteTransaction = async (req, res) => {
  try {
    const shouldReturn = await searchUserAndCheckAdmin(req, res, false);
    if (shouldReturn) return;
    if (!req.body._id) {
      return res.status(400).json({
        message: "Transaction id invalid",
      });
    }
    await transactions.deleteOne({ _id: req.body._id });
    return res.json({
      message: "Transaction deleted",
      refreshedTokenMessage: res.locals.refreshedTokenMessage,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Delete multiple transactions identified by their ids
- Request Parameters: None
- Request Body Content: An array of strings that lists the `_ids` of the transactions to be deleted
  - Example: `{_ids: ["6hjkohgfc8nvu786"]}`
- Response `data` Content: A message confirming successful deletion
  - Example: `res.status(200).json({data: {message: "Transactions deleted"}, refreshedTokenMessage: res.locals.refreshedTokenMessage})`
- In case any of the following errors apply then no transaction is deleted
- Returns a 400 error if the request body does not contain all the necessary attributes
- Returns a 400 error if at least one of the ids in the array is an empty string
- Returns a 400 error if at least one of the ids in the array does not represent a transaction in the database
- Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin)
 */
export const deleteTransactions = async (req, res) => {
  try {
    const shouldReturn = await searchUserAndCheckAdmin(req, res, true);
    if (shouldReturn) return;
    if (!req.body._ids || req.body._ids.length === 0) {
      return res.status(400).json({
        message: "Transactions ids invalid",
      });
    }
    if (req.body._ids.includes("")) {
      return res.status(400).json({
        message: "Transactions ids invalid",
      });
    }
    for (const id of req.body._ids) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          message: `${id} is not a valid transaction id`,
        });
      }
      const t = await transactions.findOne({ _id: id });
      if (!t) {
        return res.status(400).json({
          message: `${id} is not a valid transaction id`,
        });
      }
    }
    await transactions.deleteMany({ _id: { $in: req.body._ids } });
    return res.json({
      message: "Transactions deleted",
      refreshedTokenMessage: res.locals.refreshedTokenMessage,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
