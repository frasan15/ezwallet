import request from 'supertest';
import { app } from '../app';
import { categories, transactions } from '../models/model';
import { verifyAuth } from '../controllers/utils';
import { createCategory, getCategories } from '../controllers/controller';

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
    test("Category Deleted successfully" , async()=>{
        const req = {
            body : {
                types : ["student"]
            },
            cookies: {accessToken: "aaaaa", refreshToken: "bbbbb"},
            url: "/api/categories"
        }
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshTokenMessage: ""
            }
        }

        verifyAuth.mockImplementation(() => {
            return {authorized: true, cause: "Authorized"}
        })

        categories.count.mockResolvedValueOnce(3)
        categories.findOne.mockResolvedValueOnce({ type: "student" })
        categories.deleteOne.mockResolvedValueOnce({ deletedCount: 1 })
        categories.findOne.mockResolvedValueOnce({ type: "student" })
        transactions.updateMany.mockResolvedValueOnce({ modifiedCount: 1 })

        await deleteCategory(req,res)
        expect(res.json).toHaveBeenCalledWith({data: { message: "categories correctly deleted", count: 1 },
        refreshedTokenMessage: undefined,
          });
  });
    test("Should return 401 Error if user is Unauthorized" , async() =>{
        verifyAuth.mockImplementation(() => {
            return {authorized: false, cause: "Unauthorized"}
        })
        const req = {
            body: {
                
            },
            cookies: {accessToken: "aaaa", refreshToken: "bbbbb"},
            url: "/api/categories"
        }

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshTokenMessage: ""
            }
        }
        await deleteCategory(req,res)
        expect(res.status).toHaveBeenCalledWith(401)

    });


    test("Should return 400 Error if only one category is left", async () => {
        const req = {
            body : {
                type : ["university"]
            },
            cookies: {accessToken: "aaaaa", refreshToken: "bbbbb"},
            url: "/api/categories"
        }
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshTokenMessage: ""
            }
        }

        verifyAuth.mockImplementation(() => {
            return {authorized: true, cause: "Authorized"}
        })
        const mocCategories = {
            type :["food"]
        }
            
        categories.count.mockResolvedValueOnce(mocCategories)
        await deleteCategory(req,res)
        expect(res.status).toHaveBeenLastCalledWith(400)
        expect(res.json).toHaveBeenCalledWith( {error: expect.any(String)})
    });
    test("Should return 400 Error if Request body is Empty", async() =>{ 
        const req = {
            body: {
                type: [" "],

            },
            cookies: {accessToken: "aaaaa", refreshToken: "bbbbb"},
            url: "/api/categories"
        }

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            locals: {
                refreshTokenMessage: ""
            }
        }
        verifyAuth.mockImplementation(() => {
            return {authorized: true, cause: "Authorized"}
        })
        await deleteCategory(req,res)
        expect(res.status).toHaveBeenCalledWith(400)
        expect(res.json).toHaveBeenCalledWith( {error: expect.any(String)})
        });
        test("Should return 400 if the category is not exist in DataBase", async()=> {
            const req = {
                body : {
                    types : ["university"]
                },
                cookies: {accessToken: "aaaaa", refreshToken: "bbbbb"},
                url: "/api/categories"
            }
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
                locals: {
                    refreshTokenMessage: ""
                }
            }
            verifyAuth.mockImplementation(() => {
                return {authorized: true, cause: "Authorized"}
            })
            categories.findOne.mockResolvedValue(null)
            await deleteCategory(req,res)
            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.json).toHaveBeenCalledWith( {error: expect.any(String)})

        });
        test("Should return 400 error if the request body does not contain all the necessary attributes" ,
         async()=>{
            const req = {
                body : {
                    types : [" "]
                },
                cookies: {accessToken: "aaaaa", refreshToken: "bbbbb"},
                url: "/api/categories"
            }
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
                locals: {
                    refreshTokenMessage: ""
                }
            }
            verifyAuth.mockImplementation(() => {
                return {authorized: true, cause: "Authorized"}
            })
            await deleteCategory(req,res)
            
            expect(res.status).toHaveBeenCalledWith(400)
            expect(res.json).toHaveBeenCalledWith( {error: expect.any(String)})
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
          

        
    })


describe("getCategories", () => { 
    test('getting of categories successfully completed', async () => {
        const mockReq = {
            body: {},
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

        const retrievedCategories = [{ type: 'test1', color: 'color1' }, { type: 'test2', color: 'color2' }]
        jest.spyOn(categories, "find").mockImplementation(() => retrievedCategories)

        await getCategories(mockReq, mockRes)

        expect(mockRes.status).toHaveBeenCalledWith(200)
        expect(mockRes.json).toHaveBeenCalledWith(
            {data: expect.any(Array) , refreshedTokenMessage: undefined})

    });

    test('Returns a 401 error if called by a user who is not authenticated (authType = Simple)', async () => {
        verifyAuth.mockImplementation(() => {
            return {authorized: false, cause: "Unauthorized"}
        })

        const mockReq = {
            body: {},
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

        await getCategories(mockReq, mockRes)
        expect(mockRes.status).toHaveBeenCalledWith(401)

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
