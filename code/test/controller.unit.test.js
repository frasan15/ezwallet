import request from "supertest";
import { app } from "../app";
import { categories, transactions } from "../models/model";
import { verifyAuth } from "../controllers/utils";
import {
  createCategory,
  createTransaction,
  deleteCategory,
  deleteTransaction,
  getAllTransactions,
  getCategories,
  getTransactionsByGroup,
} from "../controllers/controller";
import { Group, User } from "../models/User";

jest.mock("bcryptjs")
jest.mock("jsonwebtoken")
jest.mock("../models/User.js")
jest.mock('../models/model.js');


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
jest.mock('../controllers/utils.js', () => ({
    verifyAuth: jest.fn(),
}))

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
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
    });
})

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
      body: {},
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
    const bodyArray = [
      { username: null, amount: null, type: null },
      { username: "Test", amount: "Twelve", type: "food" },
      { username: "Invalid Username", amount: 12, type: "food" },
      { username: "Test", amount: 12, type: "Invalid Type" },
    ];
    User.findOne.mockImplementation(() => {
      return null;
    });
    categories.findOne.mockImplementation(() => {
      return null;
    });
    for (let i = 0; i < bodyArray.length; i++) {
      mockReq.body = bodyArray[i];
      await createTransaction(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: expect.any(String),
      });
    }
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
});

describe("getTransactionsByUser", () => {
  test("Dummy test, change it", () => {
    expect(true).toBe(true);
  });
});

describe("getTransactionsByUserByCategory", () => {
  test("Dummy test, change it", () => {
    expect(true).toBe(true);
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
  test("Dummy test, change it", () => {
    expect(true).toBe(true);
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
  test("Dummy test, change it", () => {
    expect(true).toBe(true);
  });
});
