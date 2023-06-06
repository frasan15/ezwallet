import request from "supertest";
import { app } from "../app";
import { User, Group } from "../models/User.js";
import { transactions, categories } from "../models/model";
import mongoose, { Model } from "mongoose";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { verifyAuth } from "../controllers/utils";

/**
 * Necessary setup in order to create a new database for testing purposes before starting the execution of test cases.
 * Each test suite has its own database in order to avoid different tests accessing the same database at the same time and expecting different data.
 */
dotenv.config();
beforeAll(async () => {
  const dbName = "testingDatabaseUsers";
  const url = `${process.env.MONGO_URI}/${dbName}`;

  await mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

const adminAccessTokenValid = jwt.sign(
  {
    email: "admin@email.com",
    //id: existingUser.id, The id field is not required in any check, so it can be omitted
    username: "admin",
    role: "Admin",
  },
  process.env.ACCESS_KEY,
  { expiresIn: "1y" }
);

const testerAccessTokenValid = jwt.sign(
  {
    email: "tester@test.com",
    username: "tester",
    role: "Regular",
  },
  process.env.ACCESS_KEY,
  { expiresIn: "1y" }
);

/**
 * After all test cases have been executed the database is deleted.
 * This is done so that subsequent executions of the test suite start with an empty database.
 */
afterAll(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.connection.close();
});

beforeEach(async () => {
  await categories.deleteMany({});
  await transactions.deleteMany({});
  await User.deleteMany({});
  await Group.deleteMany({});
  jest.clearAllMocks();
});

describe("getUsers", () => {
  test("should return empty list if there are no users", async () => {
    const response = await request(app)
      .get("/api/users")
      .set(
        "Cookie",
        `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`
      )
      .send();
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(0);
  });

  test("should retrieve list of all users", async () => {
    const usersArray = [
      {
        username: "tester",
        email: "tester@test.com",
        password: "tester",
        role: "Regular",
        refreshToken: testerAccessTokenValid,
      },
      {
        username: "admin",
        email: "admin@email.com",
        password: "admin",
        refreshToken: adminAccessTokenValid,
        role: "Admin",
      },
    ];
    await User.insertMany(usersArray);
    //The API request must be awaited as well
    const response = await request(app)
      .get("/api/users")
      .set(
        "Cookie",
        `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`
      )
      .send();
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
    for (let i = 0; i < usersArray.length; i++) {
      expect(response.body.data[i].username).toEqual(usersArray[i].username);
      expect(response.body.data[i].email).toEqual(usersArray[i].email);
      expect(response.body.data[i].role).toEqual(usersArray[i].role);
    }
  });

  test("should return 401 if user is not authorized", async () => {
    const user = {
      username: "tester",
      email: "tester@test.com",
      password: "tester",
      refreshToken: testerAccessTokenValid,
    };
    await User.create(user);
    const response = await request(app)
      .get("/api/users")
      .set(
        "Cookie",
        `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`
      )
      .send();
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("error");
  });
});

describe("getUser", () => {});

describe("createGroup", () => {});

describe("getGroups", () => {});

describe("getGroup", () => { });

describe("addToGroup", () => {});

describe("removeFromGroup", () => {});

describe("deleteUser", () => {
  test("should return 401 if user is not authorized", async () => {
    const user = {
      username: "tester",
      email: "tester@test.com",
      password: "tester",
      refreshToken: testerAccessTokenValid,
    };
    await User.create(user);
    const response = await request(app)
      .delete("/api/users")
      .set(
        "Cookie",
        `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`
      )
      .send({ email: user.email });
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("error");
  });

  test("should return 400 if email is missing, empty or invalid", async () => {
    const user = {
      username: "tester",
      email: "tester@test.com",
      password: "tester",
      role: "Admin",
      refreshToken: adminAccessTokenValid,
    };
    await User.create(user);
    const wrongEmails = [null, "", "test", "test@", "test@test", "test@test."];
    for (let i = 0; i < wrongEmails.length; i++) {
      const response = await request(app)
        .delete("/api/users")
        .set(
          "Cookie",
          `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`
        )
        .send({ email: wrongEmails[i] });
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    }
  });

  test("should return 400 if user does not exist in database", async () => {
    const user = {
      username: "tester",
      email: "tester@test.com",
      password: "tester",
      role: "Admin",
      refreshToken: adminAccessTokenValid,
    };
    await User.create(user);
    const response = await request(app)
      .delete("/api/users")
      .set(
        "Cookie",
        `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`
      )
      .send({ email: "anotheremail@test.com" });
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toEqual(
      "Email does not represent a user in the database"
    );
  });

  test("should return 400 if user is not an admin", async () => {
    const user = {
      username: "tester",
      email: "tester@test.com",
      password: "tester",
      role: "Admin",
      refreshToken: adminAccessTokenValid,
    };
    await User.create(user);
    const response = await request(app)
      .delete("/api/users")
      .set(
        "Cookie",
        `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`
      )
      .send({ email: user.email });
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toEqual("User to be deleted cannot be admin");
  });

  test("should return 200 if user and his transactions are deleted, with one user in a group", async () => {
    const usersArray = [
      {
        username: "tester",
        email: "tester@test.com",
        password: "tester",
        role: "Regular",
        refreshToken: testerAccessTokenValid,
      },
      {
        username: "admin",
        email: "admin@email.com",
        password: "admin",
        refreshToken: adminAccessTokenValid,
        role: "Admin",
      },
    ];
    await User.insertMany(usersArray);
    const transactionsArray = [
      {
        username: "tester",
        type: "food",
        amount: 20,
      },
      {
        username: "tester",
        type: "groceries",
        amount: 100,
      },
      {
        username: "admin",
        type: "food",
        amount: 89,
      },
    ];
    const userTester = await User.findOne({ username: "tester" });
    await transactions.insertMany(transactionsArray);
    const group = {
      name: "testGroup",
      members: [
        {
          email: userTester.email,
          user: userTester._id,
        },
      ],
    };
    await Group.create(group);
    const response = await request(app)
      .delete("/api/users")
      .set(
        "Cookie",
        `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`
      )
      .send({ email: userTester.email });
    expect(response.status).toBe(200);
    expect(response.body.data.deletedTransaction).toEqual(2);
    expect(response.body.data.deletedFromGroup).toEqual(true);
    const deletedGroup = await Group.findOne({ name: "testGroup" });
    expect(deletedGroup).toEqual(null);
  });
});

describe("deleteGroup", () => {});
