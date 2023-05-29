import { categories, transactions } from "../models/model.js";
import { Group, User } from "../models/User.js";
import { handleDateFilterParams, handleAmountFilterParams, verifyAuth } from "./utils.js";

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
        const Admin= verifyAuth(req, res, { authType: "Admin" });
        if (!Admin) 
        return res.status(401).json({ message: "Unauthorized" }) // unauthorized
        const { type, color } = req.body;
        if (!type || !color)
        return res.status(400).json({message: "Missing or wrong parameters"});
        if (type.length==0 || color.length==0)
        return res.status(400).json({message: "empty string not acceptable"});
        const category = await categories.findOne({type: type});
        if (category) 
        return res.status(400).json({message: "category already exist"})
        const new_categories =await new categories({ type: type, color:color }).save();
        return res.status(200).json({data :{new_categories} , refreshedTokenMessage: res.locals.refreshedTokenMessage});
        }
        catch (error) {
        res.status(400).json({ error: error.message })
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

    } catch (error) {
        res.status(400).json({ error: error.message })
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

    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

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
        const user= verifyAuth(req, res, { authType: "Simple" })
        if (!user || !user.authorized)
        return res.status(401).json({message: "Unauthorized"})
        let data = await categories.find({})
        let filter = data.map(v => Object.assign({}, { type: v.type, color: v.color }))
        return res.status(200).json({data: {filter},refreshedTokenMessage: res.locals.refreshedTokenMessage })
    } 
    catch (error) {
        res.status(400).json({ error: error.message })
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
        const cookie = req.cookies
        if (!cookie.accessToken) {
            return res.status(401).json({ message: "Unauthorized" }) // unauthorized
        }
        const { username, amount, type } = req.body;
        const new_transactions = new transactions({ username, amount, type });
        new_transactions.save()
            .then(data => res.json(data))
            .catch(err => { throw err })
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

/**
 * Return all transactions made by all users
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having attributes `username`, `type`, `amount`, `date` and `color`
  - Optional behavior:
    - empty array must be returned if there are no transactions
 */
export const getAllTransactions = async (req, res) => {
    try {
        const cookie = req.cookies
        if (!cookie.accessToken) {
            return res.status(401).json({ message: "Unauthorized" }) // unauthorized
        }
        /**
         * MongoDB equivalent to the query "SELECT * FROM transactions, categories WHERE transactions.type = categories.type"
         */
        transactions.aggregate([
            {
                $lookup: {
                    from: "categories",
                    localField: "type",
                    foreignField: "type",
                    as: "categories_info"
                }
            },
            { $unwind: "$categories_info" }
        ]).then((result) => {
            let data = result.map(v => Object.assign({}, { _id: v._id, username: v.username, amount: v.amount, type: v.type, color: v.categories_info.color, date: v.date }))
            res.json(data);
        }).catch(error => { throw (error) })
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

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
        if (req.url.indexOf("/transactions/users/") >= 0) {
        } else {
        }
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

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
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

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
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

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
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

/**
 * Delete a transaction made by a specific user
  - Request Body Content: The `_id` of the transaction to be deleted
  - Response `data` Content: A string indicating successful deletion of the transaction
  - Optional behavior:
    - error 401 is returned if the user or the transaction does not exist
 */
export const deleteTransaction = async (req, res) => {
    try {
        const cookie = req.cookies
        if (!cookie.accessToken) {
            return res.status(401).json({ message: "Unauthorized" }) // unauthorized
        }
        let data = await transactions.deleteOne({ _id: req.body._id });
        return res.json("deleted");
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}

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
        res.status(400).json({ error: error.message })
    }
}
