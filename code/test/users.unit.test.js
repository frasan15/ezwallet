import request from "supertest";
import { app } from "../app";
import { User } from "../models/User.js";
import { Group } from "../models/User.js";
import { deleteUser, getGroups, getUsers } from "../controllers/users";
import { isValidEmail, verifyAuth } from "../controllers/utils";
import jwt from "jsonwebtoken";
import { transactions } from "../models/model";

/**
 * In order to correctly mock the calls to external modules it is necessary to mock them using the following line.
 * Without this operation, it is not possible to replace the actual implementation of the external functions with the one
 * needed for the test cases.
 * `jest.mock()` must be called for every external module that is called in the functions under test.
 */
jest.mock("../models/User.js");
jest.mock("../models/model.js");
jest.mock("../controllers/utils.js", () => ({
  verifyAuth: jest.fn(),
  isValidEmail: jest.fn(),
}));
/*
const userOne = {email: "user@test.com", username: "frasan", role: "Admin"}

const accessToken = ""
const refreshToken = ""
userOne.refreshToken = jwt.sign({
  email: userOne.email,
  id: userOneId.toString(),
  username: userOne.username,
  role: userOne.role
}, process.env.ACCESS_KEY, { expiresIn: '7d' });
*/

beforeEach(() => {
  User.find.mockClear();
  Group.find.mockClear();
  jest.clearAllMocks();
  User.findOneAndDelete.mockClear();
  verifyAuth.mockClear();
});

describe("getUsers", () => {
  test("should return empty list if there are no users", async () => {
    //any time the `User.find()` method is called jest will replace its actual implementation with the one defined below
    jest.spyOn(User, "find").mockImplementation(() => []);
    verifyAuth.mockImplementation(() => {
      return { authorized: true, cause: "Authorized" };
    });
    const response = await request(app).get("/api/users");

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
  });

  test("should retrieve list of all users", async () => {
    const retrievedUsers = [
      {
        username: "test1",
        email: "test1@example.com",
        password: "hashedPassword1",
      },
      {
        username: "test2",
        email: "test2@example.com",
        password: "hashedPassword2",
      },
    ];
    verifyAuth.mockImplementation(() => {
      return { authorized: true, cause: "Authorized" };
    });
    jest.spyOn(User, "find").mockImplementation(() => retrievedUsers);
    const mockReq = {
      params: {},
      body: {},
      cookies: {
        accessToken: "adminAccessTokenValid",
        refreshToken: "adminRefreshTokenValid",
      },
      url: "/api/users",
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: "",
      },
    };
    await getUsers(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining(retrievedUsers),
      })
    );
  });

  test("should return 401 if user is not authorized", async () => {
    verifyAuth.mockImplementation(() => {
      return { authorized: false, cause: "Not authorized" };
    });
    const mockReq = {
      params: {},
      body: {},
      cookies: {
        accessToken: "adminAccessTokenValid",
        refreshToken: "adminRefreshTokenValid",
      },
      url: "/api/users",
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: "",
      },
    };
    await getUsers(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ error: expect.any(String) });

    const response = await request(app).get("/api/users");

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Not authorized");
  });
});

describe("getUser", () => {});

describe("createGroup", () => {});

describe("getGroups", () => {
  /*
  test("should return empty list if there are no groups", async () => {
    const mockReq = {
      cookies: "accessToken=accessToken; refreshToken=refreshToken"
    }

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    jest.spyOn(Group, "find").mockResolvedValue(() => [])
    await getGroups(mockReq, mockRes)
    expect(Group.find).toHaveBeenCalled()
    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith([])
  });

  test("should return list of groups for admin", async () => {
    const groups = [
      {name: "Family", members: [{email: "mario.red@email.com"}, {email: "luigi.red@email.com"}]}, 
      {name: "Friends", members: [{email: "francesco.green@email.com"}, {email: "marco.blue@email.com"}]}
    ];

    verifyAuth.mockImplementation(() => ({authorized: true, cause: "Authorized"}))
    Group.find.mockImplementation(() => groups)

    const response = await request(app).get("/api/groups");

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      data: groups.map(group => ({name: group.name, members: group.members}))
    })
  })

  test("should retrieve list of all groups", async () => {
    const retrievedGroup = [{name: "Family", members: [{email: "mario.red@email.com"}, {email: "luigi.red@email.com"}]}, 
                            {name: "Friends", members: [{email: "francesco.green@email.com"}, {email: "marco.blue@email.com"}]}]
    jest.spyOn(Group, "find").mockImplementation(() => retrievedGroup)
    const response = await request(app).get("/api/groups")

    expect(response.status).toBe(200)
    expect(response.body).toEqual(retrievedGroup)
 
  })
  */
});

describe("getGroup", () => {});

describe("addToGroup", () => {});

describe("removeFromGroup", () => {});

describe("deleteUser", () => {
  test("should return 401 if user is not authorized", async () => {
    verifyAuth.mockImplementation(() => {
      return { authorized: false, cause: "Not authorized" };
    });
    const mockReq = {
      params: {},
      body: {},
      cookies: {
        accessToken: "adminAccessTokenValid",
        refreshToken: "adminRefreshTokenValid",
      },
      url: "/api/users",
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: "",
      },
    };
    await deleteUser(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ error: expect.any(String) });
  });

  test("should return 400 if email is missing, empty or invalid", async () => {
    verifyAuth.mockImplementation(() => {
      return { authorized: true, cause: "Authorized" };
    });
    const wrongEmails = [
      null,
      "",
      "test",
      "test@",
      "test@example",
      "test@example.",
    ];
    const mockReq = {
      params: {},
      body: {
        email: "test@",
      },
      cookies: {
        accessToken: "adminAccessTokenValid",
        refreshToken: "adminRefreshTokenValid",
      },
      url: "/api/users",
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: "",
      },
    };

    for (let i = 0; i < wrongEmails.length; i++) {
      mockReq.body.email = wrongEmails[i];
      await deleteUser(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: expect.any(String),
      });
    }
  });

  test("should return 400 if user does not exist in database", async () => {
    verifyAuth.mockImplementation(() => {
      return { authorized: true, cause: "Authorized" };
    });
    const mockReq = {
      params: {},
      body: {
        email: "test@test.com",
      },
      cookies: {
        accessToken: "adminAccessTokenValid",
        refreshToken: "adminRefreshTokenValid",
      },
      url: "/api/users",
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: "",
      },
    };
    jest.spyOn(User, "findOneAndDelete").mockImplementation(() => {
      return undefined;
    });
    isValidEmail.mockImplementation(() => {
      return true;
    });
    await deleteUser(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: "Email does not represent a user in the database",
    });
  });

  test("should return 400 if user is an admin", async () => {
    verifyAuth.mockImplementation(() => {
      return { authorized: true, cause: "Authorized" };
    });
    const mockReq = {
      params: {},
      body: {
        email: "test@test.com",
      },
      cookies: {
        accessToken: "adminAccessTokenValid",
        refreshToken: "adminRefreshTokenValid",
      },
      url: "/api/users",
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: "",
      },
    };
    jest.spyOn(User, "findOneAndDelete").mockImplementation(() => {
      return { role: "Admin" };
    });
    isValidEmail.mockImplementation(() => {
      return true;
    });
    await deleteUser(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: "User to be deleted cannot be admin",
    });
  });

  test("should return 200 if user and his transactions are deleted, with one user in a group", async () => {
    verifyAuth.mockImplementation(() => {
      return { authorized: true, cause: "Authorized" };
    });
    const mockReq = {
      params: {},
      body: {
        email: "test@test.com",
      },
      cookies: {
        accessToken: "adminAccessTokenValid",
        refreshToken: "adminRefreshTokenValid",
      },
      url: "/api/users",
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: "",
      },
    };
    isValidEmail.mockImplementation(() => {
      return true;
    });
    User.findOneAndDelete.mockImplementation(() => {
      return { role: "User" };
    });
    transactions.find.mockImplementation(() => {
      return [{ _id: "1" }];
    });
    transactions.deleteMany.mockImplementation(() => {
      return { deletedCount: 1 };
    });
    Group.findOne.mockImplementation(() => {
      return { members: ["1"] };
    });
    Group.deleteOne.mockImplementation(() => {});

    await deleteUser(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      data: expect.objectContaining({
        deletedFromGroup: expect.any(Boolean),
        deletedTransaction: expect.any(Number),
      }),
      refreshedTokenMessage: expect.any(String),
    });
  });
});

describe("deleteGroup", () => {});
