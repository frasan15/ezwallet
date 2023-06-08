import request from "supertest";
import { app } from "../app";
import { categories, transactions } from "../models/model";
import {
  handleDateFilterParams,
  handleAmountFilterParams,
  verifyAuth,
} from "../controllers/utils";
import {
  createCategory,
  createTransaction,
  deleteCategory,
  deleteTransaction,
  getAllTransactions,
  getCategories,
  getTransactionsByGroup,
  getTransactionsByUser,
  getTransactionsByUserByCategory,
  getTransactionsByGroupByCategory,
  deleteTransactions,
} from "../controllers/controller";
import { Group, User } from "../models/User";

jest.mock("bcryptjs");
jest.mock("jsonwebtoken");
jest.mock("../models/User.js");
jest.mock("../models/model.js");

beforeEach(() => {
  categories.count.mockClear();
  categories.find.mockClear();
  categories.prototype.save.mockClear();
  transactions.find.mockClear();
  transactions.deleteOne.mockClear();
  transactions.aggregate.mockClear();
  transactions.updateMany.mockClear();
  transactions.prototype.save.mockClear();
  jest.clearAllMocks();
});

//Necessary step to ensure that the functions in utils.js can be mocked correctly
jest.mock("../controllers/utils.js", () => ({
  verifyAuth: jest.fn(),
  handleDateFilterParams: jest.fn(),
  handleAmountFilterParams: jest.fn(),
}));

describe("createCategory", () => { 
    test('creation of the category successfully completed', async () => {
        const mockReq = {
            body: {
                type: "foodoooo",
                color: "red"
            },
            cookies: {accessToken: "bbbi", refreshToken: "bbjbjkb"},
            url: "/api/categories"
        }

        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshTokenMessage: ""
            }
        }

        verifyAuth.mockImplementation(() => {
            return {authorized: true, cause: "Authorized"}
        })

        categories.findOne = jest.fn().mockReturnValue(null)

        const new_value = {type: mockReq.body.type, color: mockReq.body.color}
        jest.spyOn(categories.prototype, "save").mockResolvedValue(new_value)

        await createCategory(mockReq, mockRes)

        expect(mockRes.status).toHaveBeenCalledWith(200)
        expect(mockRes.json).toHaveBeenCalledWith(
            {data :new_value , refreshedTokenMessage: undefined})

    });

    test("Returns a 400 error if the request body does not contain all the necessary attributes", async () => {
        const mockReq = {
            body: {
                type: "foodoooo",
            },
            cookies: {accessToken: "bbbi", refreshToken: "bbjbjkb"},
            url: "/api/categories"
        }

        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshTokenMessage: ""
            }
        }

        verifyAuth.mockImplementation(() => {
            return {authorized: true, cause: "Authorized"}
        })

        //const new_categories = await new categories({ type: mockReq.type, color: mockReq.color }).save();

        await createCategory(mockReq, mockRes)

        expect(mockRes.status).toHaveBeenCalledWith(400)
        expect(mockRes.json).toHaveBeenCalledWith(
            {error: expect.any(String)})
    });

    test("Returns a 400 error if at least one of the parameters in the request body is an empty string", async () => {
        const mockReq = {
            body: {
                type: "foodoooo",
                color: "   "
            },
            cookies: {accessToken: "bbbi", refreshToken: "bbjbjkb"},
            url: "/api/categories"
        }

        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshTokenMessage: ""
            }
        }

        verifyAuth.mockImplementation(() => {
            return {authorized: true, cause: "Authorized"}
        })

        await createCategory(mockReq, mockRes)

        expect(mockRes.status).toHaveBeenCalledWith(400)
        expect(mockRes.json).toHaveBeenCalledWith(
            {error: expect.any(String)})
    });

    test("Returns a 400 error if the type of category passed in the request body represents an already existing category in the database", async () => {
        const mockReq = {
            body: {
                type: "food",
                color: "yellow"
            },
            cookies: {accessToken: "bbbi", refreshToken: "bbjbjkb"},
            url: "/api/categories"
        }

        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshTokenMessage: ""
            }
        }

        verifyAuth.mockImplementation(() => {
            return {authorized: true, cause: "Authorized"}
        })

        //categories.findOne.mockResolvedValueOnce(undefined)//null because the category does not yet exist
        const mockCategory = {
            type: "food",
            color: "yellow"
        }
        categories.findOne.mockResolvedValueOnce(mockCategory)

        //const new_categories = await new categories({ type: mockReq.type, color: mockReq.color }).save();

        await createCategory(mockReq, mockRes)

        expect(mockRes.status).toHaveBeenCalledWith(400)
        expect(mockRes.json).toHaveBeenCalledWith(
            {error: expect.any(String)})
    })

    test("Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin)", async () => {
        verifyAuth.mockImplementation(() => {
            return {authorized: false, cause: "function reserved for admins only"}
        })

        const mockReq = {
            body: {
                type: "food",
                color: "yellow"
            },
            cookies: {accessToken: "bbbi", refreshToken: "bbjbjkb"},
            url: "/api/categories"
        }

        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshTokenMessage: ""
            }
        }

        await createCategory(mockReq, mockRes)

        expect(mockRes.status).toHaveBeenCalledWith(401)
        expect(mockRes.json).toHaveBeenCalledWith(
            {error: expect.any(String)})
    })
})

describe("updateCategory", () => { 
  test('Should return 401 error if called by an authenticated user who is not an admin', async() => {
      const req ={
          body :{
              type : "food" ,
              colore : "red"
          },
          cookies: {accessToken: "bbbi", refreshToken: "bbjbjkb"},
      }
      const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          locals: {
              refreshTokenMessage: ""
          }
      }
      verifyAuth.mockImplementation(() => {
          return {authorized: false, cause: "Unauthorized"}
      })
      await updateCategory(req,res)
      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({error: expect.any(String)})
  })
  test("Should 400 error if the request body does not contain all the necessary attributes" , async()=> {
      const req ={
          body :{
              type : "food" 
              
          },
          cookies: {accessToken: "bbbi", refreshToken: "bbjbjkb"},
      }
      const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          locals: {
              refreshTokenMessage: ""
          }
      }
      verifyAuth.mockImplementation(() => { return {authorized: true, cause: "Authorized"}})
      await updateCategory(req,res)
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({error: expect.any(String)})
  })

  test("Should return 400 error if request body is an empty string", async()=> {
      const req ={
          body :{
              type : "food" ,
              color : " "
              
          },
          cookies: {accessToken: "bbbi", refreshToken: "bbjbjkb"},
      }
      const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          locals: {
              refreshTokenMessage: ""
          }
      }
      verifyAuth.mockImplementation(() => { return {authorized: true, cause: "Authorized"}})
      await updateCategory(req,res)
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({error: expect.any(String)})
  })

  test("Should return 400 error if the type of category in request params is not exist in the database", async()=>{
      const req ={
          params :{
              type : "me"
          },
          body :{
              type : "food" ,
              color : "red"
              
          },
          cookies: {accessToken: "bbbi", refreshToken: "bbjbjkb"},
      }
      const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          locals: {
              refreshTokenMessage: ""
          }
      }
      verifyAuth.mockImplementation(() => { return {authorized: true, cause: "Authorized"}})
      categories.updateOne.mockResolvedValue({ modifiedCount: 0 });
      await updateCategory(req, res);
      expect(categories.updateOne).toHaveBeenCalledWith( { type: req.params.type },
      { $set: { type: req.body.type, color: req.body.color } });
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({error: expect.any(String)})
  })
  test("Should return 400 error if the type of category passed in the request body is already existing in the database", async()=> {
      const req ={
          params :{
              type : ""
          },
          body :{
              type : "food" ,
              color : "red"
              
          },
          cookies: {accessToken: "bbbi", refreshToken: "bbjbjkb"},
      }
      const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          locals: {
              refreshTokenMessage: ""
          }
      }
      verifyAuth.mockImplementation(() => { return {authorized: true, cause: "Authorized"}})
      categories.findOne.mockResolvedValue({ type: "food" })
      await updateCategory(req, res);
      expect(categories.findOne).toHaveBeenCalledWith({ type: req.body.type });
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({error: expect.any(String)})
  })
  test("Category Updated succesfully" , async()=> {
      const req ={
          params :{
              type : "food"
          },
          body :{
              type : "food2" ,
              color : "red"
              
          },
          cookies: {accessToken: "bbbi", refreshToken: "bbjbjkb"},
      }
      const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          locals: {
              refreshTokenMessage: ""
          }
      }
      verifyAuth.mockImplementation(() => { return {authorized: true, cause: "Authorized"}})
      const updateResult = { modifiedCount: 2 };
      transactions.updateMany.mockResolvedValue(updateResult);
      await updateCategory(req, res);
      expect(transactions.updateMany).toHaveBeenCalledWith(
  { type: req.params.type },
  { $set: { type: req.body.type } }
);
const expectedData = {
  count: updateResult.modifiedCount,
  message: "successful updating",
};
const expectedResponse = {
  data: expectedData,
  refreshedTokenMessage: res.locals.refreshedTokenMessage,
};
expect(res.json).toHaveBeenCalledWith(expectedResponse);
  })
});

describe("deleteCategory", () => {
  test("Category Deleted successfully", async () => {
    const req = {
      body: {
        types: ["student"],
      },
      cookies: { accessToken: "aaaaa", refreshToken: "bbbbb" },
      url: "/api/categories",
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshTokenMessage: "",
      },
    };

    verifyAuth.mockImplementation(() => {
      return { authorized: true, cause: "Authorized" };
    });

    categories.count.mockResolvedValueOnce(3);
    categories.findOne.mockResolvedValueOnce({ type: "student" });
    categories.deleteOne.mockResolvedValueOnce({ deletedCount: 1 });
    categories.findOne.mockResolvedValueOnce({ type: "student" });
    transactions.updateMany.mockResolvedValueOnce({ modifiedCount: 1 });

    await deleteCategory(req, res);
    expect(res.json).toHaveBeenCalledWith({
      data: { message: "categories correctly deleted", count: 1 },
      refreshedTokenMessage: undefined,
    });
  });
  test("Should return 401 Error if user is Unauthorized", async () => {
    verifyAuth.mockImplementation(() => {
      return { authorized: false, cause: "Unauthorized" };
    });
    const req = {
      body: {},
      cookies: { accessToken: "aaaa", refreshToken: "bbbbb" },
      url: "/api/categories",
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshTokenMessage: "",
      },
    };
    await deleteCategory(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test("Should return 400 Error if only one category is left", async () => {
    const req = {
      body: {
        type: ["university"],
      },
      cookies: { accessToken: "aaaaa", refreshToken: "bbbbb" },
      url: "/api/categories",
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshTokenMessage: "",
      },
    };

    verifyAuth.mockImplementation(() => {
      return { authorized: true, cause: "Authorized" };
    });
    const mocCategories = {
      type: ["food"],
    };

    categories.count.mockResolvedValueOnce(mocCategories);
    await deleteCategory(req, res);
    expect(res.status).toHaveBeenLastCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: expect.any(String) });
  });
  test("Should return 400 Error if Request body is Empty", async () => {
    const req = {
      body: {
        type: [" "],
      },
      cookies: { accessToken: "aaaaa", refreshToken: "bbbbb" },
      url: "/api/categories",
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshTokenMessage: "",
      },
    };
    verifyAuth.mockImplementation(() => {
      return { authorized: true, cause: "Authorized" };
    });
    await deleteCategory(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: expect.any(String) });
  });
  test("Should return 400 if the category is not exist in DataBase", async () => {
    const req = {
      body: {
        types: ["university"],
      },
      cookies: { accessToken: "aaaaa", refreshToken: "bbbbb" },
      url: "/api/categories",
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshTokenMessage: "",
      },
    };
    verifyAuth.mockImplementation(() => {
      return { authorized: true, cause: "Authorized" };
    });
    categories.findOne.mockResolvedValue(null);
    await deleteCategory(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: expect.any(String) });
  });
  test("Should return 400 error if the request body does not contain all the necessary attributes", async () => {
    const req = {
      body: {
        types: [" "],
      },
      cookies: { accessToken: "aaaaa", refreshToken: "bbbbb" },
      url: "/api/categories",
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshTokenMessage: "",
      },
    };
    verifyAuth.mockImplementation(() => {
      return { authorized: true, cause: "Authorized" };
    });
    await deleteCategory(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: expect.any(String) });
  });
  test("Should retrieve last category if N equals T", async () => {
    const req = {
      body: {
        types: ["food", "student"],
      },
      cookies: { accessToken: "aaaaa", refreshToken: "bbbbb" },
      url: "/api/categories",
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshTokenMessage: "",
      },
    };

    verifyAuth.mockImplementation(() => {
      return { authorized: true, cause: "Authorized" };
    });

    categories.count.mockResolvedValueOnce(2); // Assuming there are 2 categories in the database
    categories.findOne.mockResolvedValueOnce(null); // Return null to simulate no last category found

    await deleteCategory(req, res);

    expect(categories.findOne).toHaveBeenCalled(); // Assert that findOne is called
    // Add more assertions as needed based on the behavior you expect after retrieving the last category
  });
});

describe("getCategories", () => {
  test("getting of categories successfully completed", async () => {
    const mockReq = {
      body: {},
      cookies: { accessToken: "bbbi", refreshToken: "bbjbjkb" },
      url: "/api/categories",
    };

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshTokenMessage: "",
      },
    };

    verifyAuth.mockImplementation(() => {
      return { authorized: true, cause: "Authorized" };
    });

    const retrievedCategories = [
      { type: "test1", color: "color1" },
      { type: "test2", color: "color2" },
    ];
    jest
      .spyOn(categories, "find")
      .mockImplementation(() => retrievedCategories);

    await getCategories(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      data: expect.any(Array),
      refreshedTokenMessage: undefined,
    });
  });

  test("Returns a 401 error if called by a user who is not authenticated (authType = Simple)", async () => {
    verifyAuth.mockImplementation(() => {
      return { authorized: false, cause: "Unauthorized" };
    });

    const mockReq = {
      body: {},
      cookies: { accessToken: "bbbi", refreshToken: "bbjbjkb" },
      url: "/api/categories",
    };

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshTokenMessage: "",
      },
    };

    await getCategories(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(401);
  });
});

describe("createTransaction", () => {
  test("should return 401 if the user is not authorized", async () => {
    verifyAuth.mockImplementation(() => {
      return { authorized: false, cause: "Not authorized" };
    });
    const mockReq = {
      params: {
        username: "Test",
      },
      body: {},
      cookies: {
        accessToken: "testAccessTokenValid",
        refreshToken: "testRefreshTokenValid",
      },
      url: "/users/username/transactions",
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: "",
      },
    };
    await createTransaction(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ error: expect.any(String) });
  });

  test("should return 400 if any of the body params are missing or invalid", async () => {
    verifyAuth.mockImplementation(() => {
      return { authorized: true, cause: "Authorized" };
    });
    const mockReq = {
      params: {
        username: "Test",
      },
      body: { username: null, amount: null, type: null },
      cookies: {
        accessToken: "adminAccessTokenValid",
        refreshToken: "adminRefreshTokenValid",
      },
      url: "/users/username/transactions",
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: "",
      },
    };
    User.findOne.mockResolvedValue({ username: "Test"});
    await createTransaction(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: "Bad request: missing parameters",
    });
  });

  test("should return 400 if any of the body params are empty strings", async () => {
    verifyAuth.mockImplementation(() => {
      return { authorized: true, cause: "Authorized" };
    });
    const mockReq = {
      params: {
        username: "Test",
      },
      body: { username: "", amount: 12, type: "" },
      cookies: {
        accessToken: "adminAccessTokenValid",
        refreshToken: "adminRefreshTokenValid",
      },
      url: "/users/username/transactions",
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: "",
      },
    };
    User.findOne.mockResolvedValue({ username: "Test"});
    await createTransaction(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: "Bad request: empty string is not a valid parameter",
    });
  });

  test("should return 400 if the amount is not a number", async () => {
    verifyAuth.mockImplementation(() => {
      return { authorized: true, cause: "Authorized" };
    });
    const mockReq = {
      params: {
        username: "Test",
      },
      body: { username: "Test", amount: "12", type: "Test" },
      cookies: {
        accessToken: "adminAccessTokenValid",
        refreshToken: "adminRefreshTokenValid",
      },
      url: "/users/username/transactions",
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: "",
      },
    };
    User.findOne.mockResolvedValue({ username: "Test"});
    await createTransaction(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: "Amount must be a number",
    });
  });

  test("should return 400 if user in transaction does not exist", async () => {
    verifyAuth.mockImplementation(() => {
      return { authorized: true, cause: "Authorized" };
    });
    const mockReq = {
      params: {
        username: "Test",
      },
      body: { username: "Test", amount: 12, type: "Test" },
      cookies: {
        accessToken: "adminAccessTokenValid",
        refreshToken: "adminRefreshTokenValid",
      },
      url: "/users/username/transactions",
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: "",
      },
    };
    User.findOne = jest.fn().mockResolvedValueOnce({ username: "Test"});
    User.findOne = jest.fn().mockResolvedValueOnce(null);
    await createTransaction(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: "User not found",
    });
  });

  test("should return 400 if category in transaction does not exist", async () => {
    verifyAuth.mockImplementation(() => {
      return { authorized: true, cause: "Authorized" };
    });
    const mockReq = {
      params: {
        username: "Test",
      },
      body: { username: "Test", amount: 12, type: "Test" },
      cookies: {
        accessToken: "adminAccessTokenValid",
        refreshToken: "adminRefreshTokenValid",
      },
      url: "/users/username/transactions",
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: "",
      },
    };
    User.findOne = jest.fn().mockResolvedValue({ username: "Test"});
    categories.findOne = jest.fn().mockResolvedValue(null);
    await createTransaction(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: "Category does not exist",
    });
  });

  test("should return 200 if the transaction is created successfully", async () => {
    verifyAuth.mockImplementation(() => {
      return { authorized: true, cause: "Authorized" };
    });
    const mockReq = {
      params: {
        username: "Test",
      },
      body: { username: "Test", amount: 12, type: "food" },
      cookies: {
        accessToken: "adminAccessTokenValid",
        refreshToken: "adminRefreshTokenValid",
      },
      url: "/users/username/transactions",
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: "",
      },
    };
    User.findOne.mockImplementation(() => {
      return { _id: "123" };
    });
    categories.findOne.mockImplementation(() => {
      return { _id: "123" };
    });
    transactions.prototype.save.mockImplementation(() => {
      return { username: "Test", amount: 12, type: "food" };
    });
    await createTransaction(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      data: expect.objectContaining({
        username: expect.any(String),
        amount: expect.any(Number),
        type: expect.any(String),
      }),
      refreshedTokenMessage: expect.any(String),
    });
  });
});

describe("getAllTransactions", () => {
  test("should return 401 if the user is not authorized", async () => {
    verifyAuth.mockImplementation(() => {
      return { authorized: false, cause: "Not authorized" };
    });
    const mockReq = {
      params: {
        username: "Test",
      },
      body: {},
      cookies: {
        accessToken: "testAccessTokenValid",
        refreshToken: "testRefreshTokenValid",
      },
      url: "/api/transactions",
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: "",
      },
    };
    await getAllTransactions(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ error: expect.any(String) });
  });

  test("should return 200 with an array with all transactions", async () => {
    verifyAuth.mockImplementation(() => {
      return { authorized: true, cause: "Authorized" };
    });
    const mockReq = {
      params: {
        username: "Admin",
      },
      body: {},
      cookies: {
        accessToken: "adminAccessTokenValid",
        refreshToken: "adminRefreshTokenValid",
      },
      url: "/api/transactions",
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: "",
      },
    };
    transactions.aggregate.mockImplementation(() => {
      return [
        {
          _id: "1",
          username: "Test",
          amount: 45,
          type: "food",
          categories_info: { color: "red" },
          date: "2021-01-01T00:00:00.000Z",
        },
        {
          _id: "2",
          username: "Test2",
          amount: 32,
          type: "entertainment",
          categories_info: { color: "green" },
          date: "2022-02-02T00:00:00.000Z",
        },
      ];
    });
    await getAllTransactions(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          _id: expect.any(String),
          username: expect.any(String),
          amount: expect.any(Number),
          type: expect.any(String),
          color: expect.any(String),
          date: expect.any(String),
        }),
      ])
    );
  });
  
  test("should return 200 with an array with empty transactions array", async () => {
    verifyAuth.mockImplementation(() => {
      return { authorized: true, cause: "Authorized" };
    });
    const mockReq = {
      params: {
        username: "Admin",
      },
      body: {},
      cookies: {
        accessToken: "adminAccessTokenValid",
        refreshToken: "adminRefreshTokenValid",
      },
      url: "/api/transactions",
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: "",
      },
    };
    transactions.aggregate.mockImplementation(() => {
      return [];
    });
    await getAllTransactions(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(expect.arrayContaining([]));
  });
});

describe("getTransactionsByUser", () => {
  test("Returns data content of the Transactions of common user", async () => {
    const mockReq = {
      params: {
        username: "Test",
      },
      url: "/api/users/TestUser/transactions",
      cookies: {
        accessToken: "testerAccessTokenValid",
        refreshToken: "testerAccessTokenValid",
      },
    };

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshTokenMessage: "",
      },
    };

    verifyAuth.mockImplementation(() => {
      return { authorized: true, cause: "Authorized" };
    });

    User.findOne.mockImplementation(() => {
      return { username: "TestUser" };
    });

    const retrievedTransactionsByUser = [
      {
        username: "TestUser",
        amount: 100,
        type: "food",
        date: "2023-05-19T00:00:00",
        color: "red",
      },
      {
        username: "TestUser",
        amount: 70,
        type: "health",
        date: "2023-05-19T10:00:00",
        color: "green",
      },
    ];

    transactions.aggregate.mockResolvedValue(retrievedTransactionsByUser);

    handleDateFilterParams.mockImplementation(() => {
      {
      }
    });

    handleAmountFilterParams.mockImplementation(() => {
      {
      }
    });

    await getTransactionsByUser(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      data: retrievedTransactionsByUser,
      refreshedTokenMessage: undefined,
    });
  });

  test("Returns a 400 error if the username passed as a route parameter does not represent a user in the database", async () => {
    const mockReq = {
      params: {
        username: "Test",
      },
      url: "/api/users/TestUser/transactions",
      cookies: {
        accessToken: "testerAccessTokenValid",
        refreshToken: "testerAccessTokenValid",
      },
    };

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshTokenMessage: "",
      },
    };

    verifyAuth.mockImplementation(() => {
      return { authorized: true, cause: "Authorized" };
    });

    User.findOne.mockImplementation(() => {
      return null;
    });

    await getTransactionsByUser(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: expect.any(String) });
  });
  test("Returns a 401 error if called by an authenticated user who is not the same user as the one in the route (authType = User) if the route is `/api/users/:username/transactions`", async () => {
    const mockReq = {
      params: {
        username: "Test",
      },
      url: "/api/users/TestUser/transactions",
      cookies: {
        accessToken: "testerAccessTokenValid",
        refreshToken: "testerAccessTokenValid",
      },
    };

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshTokenMessage: "",
      },
    };

    verifyAuth.mockImplementation(() => {
      return {
        authorized: false,
        cause: "username does not match the related user's token",
      };
    });

    await getTransactionsByUser(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ error: expect.any(String) });
  });

  test("Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin) if the route is `/api/transactions/users/:username`", async () => {
    const mockReq = {
      params: {
        username: "Test",
      },
      url: "/api/transactions/users/Test",
      cookies: {
        accessToken: "testerAccessTokenValid",
        refreshToken: "testerAccessTokenValid",
      },
    };

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshTokenMessage: "",
      },
    };

    verifyAuth.mockImplementation(() => {
      return {
        authorized: false,
        cause: "function reserved for admins only",
      };
    });

    await getTransactionsByUser(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ error: expect.any(String) });
  });
});

describe("getTransactionsByUserByCategory", () => {
  test("Returns data content of the Transactions By User By Category", async () => {
    const mockReq = {
      params: {
        username: "TestUser",
        category: "food",
      },
      url: "/api/users/TestUser/transactions/category/food",
      cookies: {
        accessToken: "testerAccessTokenValid",
        refreshToken: "testerAccessTokenValid",
      },
    };

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshTokenMessage: "",
      },
    };

    categories.findOne.mockImplementation(() => {
      return { type: "food" };
    });

    verifyAuth.mockImplementation(() => {
      return { authorized: true, cause: "Authorized" };
    });

    User.findOne.mockImplementation(() => {
      return { username: "TestUser" };
    });

    const retrievedTransactionsByUserByCategory = [
      {
        username: "TestUser",
        amount: 100,
        type: "food",
        date: "2023-05-19T00:00:00",
        color: "red",
      },
    ];

    transactions.aggregate.mockResolvedValue(
      retrievedTransactionsByUserByCategory
    );

    handleDateFilterParams.mockImplementation(() => {
      {
      }
    });

    handleAmountFilterParams.mockImplementation(() => {
      {
      }
    });

    await getTransactionsByUserByCategory(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      data: retrievedTransactionsByUserByCategory,
      refreshedTokenMessage: undefined,
    });
  });
  test("Returns a 400 error if the username passed as a route parameter does not represent a user in the database", async () => {
    const mockReq = {
      params: {
        username: "TestUser",
        category: "food",
      },
      url: "/api/users/TestUser/transactions/category/food",
      cookies: {
        accessToken: "testerAccessTokenValid",
        refreshToken: "testerAccessTokenValid",
      },
    };

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshTokenMessage: "",
      },
    };

    categories.findOne.mockImplementation(() => {
      return { type: "food" };
    });

    verifyAuth.mockImplementation(() => {
      return { authorized: true, cause: "Authorized" };
    });

    User.findOne.mockImplementation(() => {
      return null;
    });

    await getTransactionsByUserByCategory(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: expect.any(String) });
  });
  test("Returns a 400 error if the category passed as a route parameter does not represent a category in the database", async () => {
    const mockReq = {
      params: {
        username: "TestUser",
        category: "food",
      },
      url: "/api/users/TestUser/transactions/category/food",
      cookies: {
        accessToken: "testerAccessTokenValid",
        refreshToken: "testerAccessTokenValid",
      },
    };

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshTokenMessage: "",
      },
    };

    categories.findOne.mockImplementation(() => {
      return null;
    });
    await getTransactionsByUserByCategory(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: expect.any(String) });
  });
  test("Returns a 401 error if called by an authenticated user who is not the same user as the one in the route (authType = User) if the route is `/api/users/:username/transactions/category/:category`", async () => {
    const mockReq = {
      params: {
        username: "TestUser",
        category: "food",
      },
      url: "/api/users/TestUser/transactions/category/food",
      cookies: {
        accessToken: "testerAccessTokenValid",
        refreshToken: "testerAccessTokenValid",
      },
    };

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshTokenMessage: "",
      },
    };

    categories.findOne.mockImplementation(() => {
      return { type: "food" };
    });

    verifyAuth.mockImplementation(() => {
      return {
        authorized: false,
        cause: "username does not match the related user's token",
      };
    });

    await getTransactionsByUserByCategory(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ error: expect.any(String) });
  });
  test("Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin) if the route is `/api/transactions/users/:username/category/:category`", async () => {
    const mockReq = {
      params: {
        username: "TestUser",
        category: "food",
      },
      url: "/api/transactions/users/TestUser/category/food",
      cookies: {
        accessToken: "testerAccessTokenValid",
        refreshToken: "testerAccessTokenValid",
      },
    };

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshTokenMessage: "",
      },
    };

    categories.findOne.mockImplementation(() => {
      return { type: "food" };
    });

    verifyAuth.mockImplementation(() => {
      return {
        authorized: false,
        cause: "function reserved for admins only",
      };
    });

    await getTransactionsByUserByCategory(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ error: expect.any(String) });
  });
});

describe("getTransactionsByGroup", () => {
  beforeEach(() => {
    Group.findOne.mockClear();
    User.findOne.mockClear();
  });
  test("should return 401 if the user is not authorized", async () => {
    verifyAuth.mockImplementation(() => {
      return { authorized: false, cause: "Not authorized" };
    });
    const mockReq = {
      params: {
        name: "Test",
      },
      body: {},
      cookies: {
        accessToken: "testAccessTokenValid",
        refreshToken: "testRefreshTokenValid",
      },
      url: "/api/transactions/groups/name",
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: "",
      },
    };
    Group.findOne = jest.fn().mockReturnValue({
      name: "testGroup",
      members: [
        {
          email: "tester@test.com",
          _id: "id",
        },
      ],
    });
    await getTransactionsByGroup(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ error: expect.any(String) });
  });

  test("should return 200 with an array with all transactions of the group", async () => {
    verifyAuth.mockImplementation(() => {
      return { authorized: true, cause: "Authorized" };
    });
    const mockReq = {
      params: {
        name: "Admin",
      },
      body: {},
      cookies: {
        accessToken: "adminAccessTokenValid",
        refreshToken: "adminRefreshTokenValid",
      },
      url: "/api/transactions/groups/name",
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: "",
      },
    };
    Group.findOne = jest.fn().mockReturnValue({
      name: "testGroup",
      members: [
        {
          email: "tester@test.com",
          _id: "id",
        },
      ],
    });
    User.findOne = jest.fn().mockReturnValue({ email: "tester@test.com" });
    transactions.aggregate.mockImplementation(() => {
      return [
        {
          _id: "1",
          username: "Test",
          amount: 45,
          type: "food",
          color: "red",
          date: "2021-01-01T00:00:00.000Z",
        },
        {
          _id: "2",
          username: "Test2",
          amount: 32,
          type: "entertainment",
          color: "green",
          date: "2022-02-02T00:00:00.000Z",
        },
      ];
    });
    await getTransactionsByGroup(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          _id: expect.any(String),
          username: expect.any(String),
          amount: expect.any(Number),
          type: expect.any(String),
          color: expect.any(String),
          date: expect.any(String),
        }),
      ]),
      refreshedTokenMessage: expect.any(String),
    });
  });
});

describe("getTransactionsByGroupByCategory", () => {
  test("Returns data content of the Transactions", async () => {
    const mockReq = {
      params: {
        name: "TestGroup",
        category: "food",
      },
      url: "/api/groups/TestGroup/transactions/category/food",
      cookies: {
        accessToken: "testerAccessTokenValid",
        refreshToken: "testerAccessTokenValid",
      },
    };

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshTokenMessage: "",
      },
    };

    categories.findOne.mockImplementation(() => {
      return { type: "food" };
    });

    Group.findOne.mockImplementation(() => {
      return {
        name: "TestGroup",
        members: [{ username: "TestUser", email: "TestEmail" }],
      };
    });

    verifyAuth.mockImplementation(() => {
      return { authorized: true, cause: "Authorized" };
    });

    Group.findOne = jest.fn().mockReturnValue({
      name: "testGroup",
      members: [
        {
          email: "tester@test.com",
          _id: "id",
        },
      ],
    });
    User.findOne = jest.fn().mockReturnValue({ email: "tester@test.com" });

    const retrievedTransactionsByGroupByCategory = [
      {
        username: "Mario",
        amount: 100,
        type: "food",
        date: "2023-05-19T00:00:00",
        color: "red",
      },
      {
        username: "Luigi",
        amount: 20,
        type: "food",
        date: "2023-05-19T10:00:00",
        color: "red",
      },
    ];

    transactions.aggregate.mockResolvedValue(
      retrievedTransactionsByGroupByCategory
    );

    handleDateFilterParams.mockImplementation(() => {
      {
      }
    });

    handleAmountFilterParams.mockImplementation(() => {
      {
      }
    });

    await getTransactionsByGroupByCategory(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      data: retrievedTransactionsByGroupByCategory,
      refreshedTokenMessage: undefined,
    });
  });
  test("Returns a 400 error if the group name passed as a route parameter does not represent a group in the database", async () => {
    const mockReq = {
      params: {
        name: "TestGroup",
        category: "food",
      },
      url: "/api/groups/TestGroup/transactions/category/food",
      cookies: {
        accessToken: "testerAccessTokenValid",
        refreshToken: "testerAccessTokenValid",
      },
    };

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshTokenMessage: "",
      },
    };

    categories.findOne.mockImplementation(() => {
      return { type: "food" };
    });

    Group.findOne.mockImplementation(() => {
      return null;
    });

    await getTransactionsByGroupByCategory(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: expect.any(String) });
  });
  test("Returns a 400 error if the category passed as a route parameter does not represent a category in the database", async () => {
    const mockReq = {
      params: {
        name: "TestGroup",
        category: "food",
      },
      url: "/api/groups/TestGroup/transactions/category/food",
      cookies: {
        accessToken: "testerAccessTokenValid",
        refreshToken: "testerAccessTokenValid",
      },
    };

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshTokenMessage: "",
      },
    };

    categories.findOne.mockImplementation(() => {
      return null;
    });
    await getTransactionsByGroupByCategory(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: expect.any(String) });
  });
  test("Returns a 401 error if called by an authenticated user who is not part of the group (authType = Group) if the route is `/api/groups/:name/transactions/category/:category`", async () => {
    const mockReq = {
      params: {
        name: "TestGroup",
        category: "food",
      },
      url: "/api/groups/TestGroup/transactions/category/food",
      cookies: {
        accessToken: "testerAccessTokenValid",
        refreshToken: "testerAccessTokenValid",
      },
    };

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshTokenMessage: "",
      },
    };

    categories.findOne.mockImplementation(() => {
      return { type: "food" };
    });

    Group.findOne.mockImplementation(() => {
      return {
        name: "TestGroup",
        members: [{ username: "TestUser", email: "TestEmail" }],
      };
    });

    verifyAuth.mockImplementation(() => {
      return {
        authorized: false,
        cause: "unauthorized, you are not part of the requested group",
      };
    });

    await getTransactionsByGroupByCategory(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ error: expect.any(String) });
  });
  test("Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin) if the route is `/api/transactions/groups/:name/category/:category`", async () => {
    const mockReq = {
      params: {
        name: "TestGroup",
        category: "food",
      },
      url: "/api/transactions/groups/TestGroup/category/food",
      cookies: {
        accessToken: "testerAccessTokenValid",
        refreshToken: "testerAccessTokenValid",
      },
    };

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshTokenMessage: "",
      },
    };

    categories.findOne.mockImplementation(() => {
      return { type: "food" };
    });

    Group.findOne.mockImplementation(() => {
      return {
        name: "TestGroup",
        members: [{ username: "TestUser", email: "TestEmail" }],
      };
    });

    verifyAuth.mockImplementation(() => {
      return {
        authorized: false,
        cause: "function reserved for admins only",
      };
    });

    await getTransactionsByGroupByCategory(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ error: expect.any(String) });
  });
});

describe("deleteTransaction", () => {
  test("should return 401 if the user is not authorized", async () => {
    verifyAuth.mockImplementation(() => {
      return { authorized: false, cause: "Not authorized" };
    });
    const mockReq = {
      params: {
        username: "Test",
      },
      body: {},
      cookies: {
        accessToken: "testAccessTokenValid",
        refreshToken: "testRefreshTokenValid",
      },
      url: "/api/users/Test/transactions",
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: "",
      },
    };
    await deleteTransaction(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ error: expect.any(String) });
  });

  test("should return 400 if the transaction id is invalid", async () => {
    verifyAuth.mockImplementation(() => {
      return { authorized: true, cause: "Authorized" };
    });
    const mockReq = {
      params: {
        username: "Test",
      },
      body: {},
      cookies: {
        accessToken: "testAccessTokenValid",
        refreshToken: "testRefreshTokenValid",
      },
      url: "/api/users/Test/transactions",
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: "",
      },
    };
    await deleteTransaction(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: "Transaction id invalid",
    });
  });

  test("should return 200 and a message if the transaction is deleted", async () => {
    verifyAuth.mockImplementation(() => {
      return { authorized: true, cause: "Authorized" };
    });
    const mockReq = {
      params: {
        username: "Test",
      },
      body: {
        _id: "123",
      },
      cookies: {
        accessToken: "testAccessTokenValid",
        refreshToken: "testRefreshTokenValid",
      },
      url: "/api/users/Test/transactions",
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: "",
      },
    };
    transactions.deleteOne.mockImplementation(() => {
      return { deletedCount: 1 };
    });
    await deleteTransaction(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: "Transaction deleted",
      refreshedTokenMessage: expect.any(String),
    });
  });
});

describe("deleteTransactions", () => {
  test("Returns data content of deleted Transactions", async () => {
    const mockReq = {
      body: {
        _ids: ["646deb79c18a785f9caf6283", "646deb95c18a785f9caf6286"],
      },
      cookies: {
        accessToken: "testerAccessTokenValid",
        refreshToken: "testerAccessTokenValid",
      },
    };

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshTokenMessage: "",
      },
    };

    verifyAuth.mockImplementation(() => {
      return { authorized: true, cause: "Authorized" };
    });

    transactions.findOne.mockImplementation(() => {
      return { _id: "646deb79c18a785f9caf6283" };
    });

    transactions.findOne.mockImplementation(() => {
      return { _id: "646deb95c18a785f9caf6286" };
    });

    const mockMessage = "Transactions deleted";

    transactions.deleteMany.mockImplementation(() => {
      return { deletedCount: 2 };
    });

    await deleteTransactions(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);

    expect(mockRes.json).toHaveBeenCalledWith({
      message: mockMessage,
      refreshedTokenMessage: undefined,
    });
  });

  test("Returns a 400 error if the request body does not contain all the necessary attributes", async () => {
    const mockReq = {
      body: {},
      cookies: {
        accessToken: "testerAccessTokenValid",
        refreshToken: "testerAccessTokenValid",
      },
    };

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshTokenMessage: "",
      },
    };

    verifyAuth.mockImplementation(() => {
      return { authorized: true, cause: "Authorized" };
    });

    await deleteTransactions(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: expect.any(String) });
  });

  test("Returns a 400 error if at least one of the ids in the array is an empty string", async () => {
    const mockReq = {
      body: {
        _ids: ["", "646deb95c18a785f9caf6286"],
      },
      cookies: {
        accessToken: "testerAccessTokenValid",
        refreshToken: "testerAccessTokenValid",
      },
    };

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshTokenMessage: "",
      },
    };

    verifyAuth.mockImplementation(() => {
      return { authorized: true, cause: "Authorized" };
    });

    await deleteTransactions(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: expect.any(String) });
  });

  test("Returns a 400 error if at least one of the ids in the array does not represent a transaction in the database", async () => {
    const mockReq = {
      body: {
        _ids: ["646deb95c18a785f9caf6286"],
      },
      cookies: {
        accessToken: "testerAccessTokenValid",
        refreshToken: "testerAccessTokenValid",
      },
    };

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshTokenMessage: "",
      },
    };

    verifyAuth.mockImplementation(() => {
      return { authorized: true, cause: "Authorized" };
    });

    transactions.findOne.mockImplementation(() => {
      return null;
    });

    await deleteTransactions(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: expect.any(String) });
  });

  test("Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin)", async () => {
    const mockReq = {
      body: {
        _ids: ["646deb95c18a785f9caf6286"],
      },
      cookies: {
        accessToken: "testerAccessTokenValid",
        refreshToken: "testerAccessTokenValid",
      },
    };

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshTokenMessage: "",
      },
    };

    verifyAuth.mockImplementation(() => {
      return {
        authorized: false,
        cause: "function reserved for admins only",
      };
    });

    transactions.findOne.mockImplementation(() => {
      return null;
    });

    await deleteTransactions(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ error: expect.any(String) });
  });
});
