import request from 'supertest';
import { app } from '../app';
import { categories, transactions } from '../models/model';
import { verifyAuth } from '../controllers/utils';
import { createCategory } from '../controllers/controller';

jest.mock("bcryptjs")
jest.mock("jsonwebtoken")
jest.mock("../models/User.js")
jest.mock('../models/model.js');


beforeEach(() => {
  categories.find.mockClear();
  categories.prototype.save.mockClear();
  transactions.find.mockClear();
  transactions.deleteOne.mockClear();
  transactions.aggregate.mockClear();
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
            return {authorized: "true", cause: "Authorized"}
        })

        //categories.findOne.mockResolvedValueOnce(undefined)//null because the category does not yet exist
        categories.findOne = jest.fn().mockReturnValue(null)

        const new_value = {type: mockReq.body.type, color: mockReq.body.color}
        jest.spyOn(categories.prototype, "save").mockResolvedValue(new_value)

        //const new_categories = await new categories({ type: mockReq.type, color: mockReq.color }).save();

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
            return {authorized: "true", cause: "Authorized"}
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
            return {authorized: "true", cause: "Authorized"}
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
            return {authorized: "true", cause: "Authorized"}
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
        verifyAuth.mockReturnValue(() => {
            return {authorized: "false", cause: "function reserved for admins only"}
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
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
    });
})

describe("getCategories", () => { 
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
    });
})

describe("createTransaction", () => { 
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
    });
})

describe("getAllTransactions", () => { 
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
    });
})

describe("getTransactionsByUser", () => { 
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
    });
})

describe("getTransactionsByUserByCategory", () => { 
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
    });
})

describe("getTransactionsByGroup", () => { 
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
    });
})

describe("getTransactionsByGroupByCategory", () => { 
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
    });
})

describe("deleteTransaction", () => { 
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
    });
})

describe("deleteTransactions", () => { 
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
    });
})
