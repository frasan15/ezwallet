import { categories, transactions } from "../models/model.js";
import { Group, User } from "../models/User.js";
import {
  handleDateFilterParams,
  handleAmountFilterParams,
  verifyAuth,
} from "./utils.js";

/**
 * Create a new category
  - Request Body Content: An object having attributes `type` and `color`
  - Response `data` Content: An object having attributes `type` and `color`
 */
export const createCategory = (req, res) => {
  try {
    const cookie = req.cookies;
    if (!cookie.accessToken) {
      return res.status(401).json({ message: "Unauthorized" }); // unauthorized
    }
    const { type, color } = req.body;
    const new_categories = new categories({ type, color });
    new_categories
      .save()
      .then((data) => res.json(data))
      .catch((err) => {
        throw err;
      });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * Edit a category's type or color
  - Request Body Content: An object having attributes `type` and `color` equal to the new values to assign to the category
  - Response `data` Content: An object with parameter `message` that confirms successful editing and a parameter `count` that is equal to the count of transactions whose category was changed with the new type
  - Optional behavior:
    - error 401 returned if the specified category does not exist
    - error 401 is returned if new parameters have invalid values
 */
    export const updateCategory = async (req, res) => {
        try {
            const cookie = req.cookies
            if (!cookie.accessToken) {
                return res.status(401).json({ message: "Unauthorized" }) // unauthorized
            }
            let {type, color} = req.body;
            let t = typeof type;
            let c = typeof color;

            if (t !== "string" || c !== "string"){
                return res.status(400).json({message: "the parameters have invalid values"})
            }
    
            const modified = await categories.updateOne({type: req.params.type}, {$set: {type: type, color: color}});

            if(modified.modifiedCount === 0){
                return res.status(400).json({message: "the specified category does not exist"});
            }

            const data = await transactions.updateMany({type: req.params.type}, {$set: {type: type}});
    
            const result = {data: {count: data.modifiedCount, message: "succesfull updating"}, message: res.locals.message};
    
            return res.json(result);
    
        } catch (error) {
            res.status(500).json({ error: error.message })
        }
    }
    

/**
 * Delete a category
  - Request Body Content: An array of strings that lists the `types` of the categories to be deleted
  - Response `data` Content: An object with parameter `message` that confirms successful deletion and a parameter `count` that is equal to the count of affected transactions (deleting a category sets all transactions with that category to have `investment` as their new category)
  - Optional behavior:
    - error 401 is returned if the specified category does not exist
 */
    export const deleteCategory = async (req, res) => {
        try {
            const cookie = req.cookies
            if (!cookie.accessToken) {
                return res.status(401).json({ message: "Unauthorized" }) // unauthorized
            }

            let count = 0;
            const {list} = req.body;

            for(const i of list){
                const check1 = await categories.findOne({type: i});
                if(check1 === null){
                    return res.status(400).json({message: `the category ${i} does not exist`});
                }
            }
    
            for (const i of list){

                const remained_categories = await categories.count();
                
                if(remained_categories === 1){
                    return res.json({message: `${i} is the last category left, it is not possible to remove it`, count: count})
                } 
                
                const cancelled = await categories.deleteOne({type: i});
                const a = await categories.findOne({}, {_id: 0, type: 1});
                
                const transaction_changed = await transactions.updateMany({type: i }, {$set: {type: a.type}})
                count += transaction_changed.modifiedCount;

                
            }
    
            
            const result = {data: {message: "categories correctly deleted", count: count}, message: res.locals.message}
    
            return res.json(result);
    
            //for each category i must check if it is contained inside the list of the categories to be deleted; at the end I have to
            //return the new array or just the original array with less element?
    
        } catch (error) {
            res.status(500).json({ error: error.message })
        }
    }
    

/**
 * Return all the categories
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having attributes `type` and `color`
  - Optional behavior:
    - empty array is returned if there are no categories
 */
export const getCategories = async (req, res) => {
  try {
    const cookie = req.cookies;
    if (!cookie.accessToken) {
      return res.status(401).json({ message: "Unauthorized" }); // unauthorized
    }
    let data = await categories.find({});

    let filter = data.map((v) =>
      Object.assign({}, { type: v.type, color: v.color })
    );

    return res.json(filter);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * Create a new transaction made by a specific user
  - Request Body Content: An object having attributes `username`, `type` and `amount`
  - Response `data` Content: An object having attributes `username`, `type`, `amount` and `date`
  - Optional behavior:
    - error 401 is returned if the username or the type of category does not exist
 */
export const createTransaction = async (req, res) => {
  try {
    const cookie = req.cookies;
    if (!cookie.accessToken) {
      return res.status(401).json({ message: "Unauthorized" }); // unauthorized
    }
    const { username, amount, type } = req.body;
    if (typeof amount !== "number") {
      return res.status(400).json({
        data: null,
        message: "Amount must be a number",
      });
    }
    if (!username || !amount || !type) {
      return res.status(400).json({
        data: null,
        message: "Bad request: missing parameters",
      });
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
    res.status(400).json({ error: error.message });
  }
};

/**
 * Return all transactions made by all users
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having attributes `username`, `type`, `amount`, `date` and `color`
  - Optional behavior:
    - empty array must be returned if there are no transactions
 */
export const getAllTransactions = async (req, res) => {
  try {
    const cookie = req.cookies;
    if (!cookie.accessToken) {
      return res.status(401).json({ message: "Unauthorized" }); // unauthorized
    }
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
    res.status(400).json({ error: error.message });
  }
};

const searchUserAndCheckAdmin = async (req, res, isAdminRoute) => {
  if (!req.params.username) {
    res.status(400).json({
      message: "Username invalid",
    });
    return true;
  }
  const user = await User.findOne({ username: req.params.username });
  if (!user) {
    res.status(401).json({
      message: "User not found",
    });
    return true;
  }
  const cookie = req.cookies;
  if (!cookie.refreshToken && !isAdminRoute) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (!isAdminRoute) {
    const userWhoMadeRequest = await User.findOne({
      refreshToken: req.cookies.refreshToken,
    });
    if (
      userWhoMadeRequest.username != req.params.username &&
      userWhoMadeRequest.role != "Admin"
    ) {
      res.status(401).json({
        message: "User does not have the privileges to access this resource",
      });
      return true;
    }
  }
  return false;
};

const commonTransactionsByUser = async (req, res) => {
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
      $match: req.params.category
        ? { "categories_info.type": req.params.category }
        : {},
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
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having attributes `username`, `type`, `amount`, `date` and `color`
  - Optional behavior:
    - error 401 is returned if the user does not exist
    - empty array is returned if there are no transactions made by the user
    - if there are query parameters and the function has been called by a Regular user then the returned transactions must be filtered according to the query parameters
 */
export const getTransactionsByUser = async (req, res) => {
  try {
    //Distinction between route accessed by Admins or Regular users for functions that can be called by both
    //and different behaviors and access rights
    const isAdminRoute = req.url.includes("/transactions/users/");
    const shouldReturn = await searchUserAndCheckAdmin(req, res, isAdminRoute);
    if (shouldReturn) return;
    commonTransactionsByUser(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * Return all transactions made by a specific user filtered by a specific category
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having attributes `username`, `type`, `amount`, `date` and `color`, filtered so that `type` is the same for all objects
  - Optional behavior:
    - empty array is returned if there are no transactions made by the user with the specified category
    - error 401 is returned if the user or the category does not exist
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
    res.status(400).json({ error: error.message });
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
  const cookie = req.cookies;
  if (!cookie.refreshToken && checkAdmin) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (checkAdmin) {
    const userWhoMadeRequest = await User.findOne({
      refreshToken: cookie.refreshToken,
    });
    if (!userWhoMadeRequest || userWhoMadeRequest.role != "Admin") {
      res.status(401).json({
        message: "User does not have the privileges to access this resource",
      });
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
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having attributes `username`, `type`, `amount`, `date` and `color`
  - Optional behavior:
    - error 401 is returned if the group does not exist
    - empty array must be returned if there are no transactions made by the group
 */
export const getTransactionsByGroup = async (req, res) => {
  try {
    const isAdminRoute = req.url.includes("/transactions/groups");
    const shouldReturn = await searchGroupAndCheckAdmin(req, res, isAdminRoute);
    if (shouldReturn) return;
    commonTransactionsByGroup(req, res, isAdminRoute);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * Return all transactions made by members of a specific group filtered by a specific category
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having attributes `username`, `type`, `amount`, `date` and `color`, filtered so that `type` is the same for all objects.
  - Optional behavior:
    - error 401 is returned if the group or the category does not exist
    - empty array must be returned if there are no transactions made by the group with the specified category
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
    res.status(400).json({ error: error.message });
  }
};

/**
 * Delete a transaction made by a specific user
  - Request Body Content: The `_id` of the transaction to be deleted
  - Response `data` Content: A string indicating successful deletion of the transaction
  - Optional behavior:
    - error 401 is returned if the user or the transaction does not exist
 */
export const deleteTransaction = async (req, res) => {
  try {
    const shouldReturn = await searchUserAndCheckAdmin(req, res, false);
    if (shouldReturn) return;
    await transactions.deleteOne({ _id: req.body._id });
    return res.json({message: "deleted"});
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * Delete multiple transactions identified by their ids
  - Request Body Content: An array of strings that lists the `_ids` of the transactions to be deleted
  - Response `data` Content: A message confirming successful deletion
  - Optional behavior:
    - error 401 is returned if at least one of the `_ids` does not have a corresponding transaction. Transactions that have an id are not deleted in this case
 */
export const deleteTransactions = async (req, res) => {
  try {
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
