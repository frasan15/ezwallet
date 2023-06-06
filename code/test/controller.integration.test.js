import request from "supertest";
import { app } from "../app";
import { categories, transactions } from "../models/model";
import mongoose, { Model } from "mongoose";
import dotenv from "dotenv";
import { Group, User } from "../models/User";
import jwt from "jsonwebtoken";

dotenv.config();

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

beforeAll(async () => {
  const dbName = "testingDatabaseController";
  const url = `${process.env.MONGO_URI}/${dbName}`;

  await mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

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

describe("createCategory", () => {
  test("Dummy test, change it", () => {
    expect(true).toBe(true);
  });
});

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
  test("should return 401 if the user is not authorized", async () => {
    const user = {
      username: "tester",
      email: "tester@test.com",
      password: "tester",
      role: "Admin",
      refreshToken: adminAccessTokenValid,
    };
    await User.create(user);
    const response = await request(app)
      .post("/api/users/notTester/transactions")
      .send({ username: "tester", amount: 12, type: "food" });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: expect.any(String) });
  });

  test("should return 400 if any of the body params are missing or invalid", async () => {
    const user = {
      username: "tester",
      email: "tester@test.com",
      password: "tester",
      refreshToken: testerAccessTokenValid,
    };
    await User.create(user);
    const bodyArray = [
      { username: null, amount: null, type: null },
      { username: "Test", amount: "Twelve", type: "food" },
      { username: "Invalid Username", amount: 12, type: "food" },
      { username: "Test", amount: 12, type: "Invalid Type" },
    ];
    for (let i = 0; i < bodyArray.length; i++) {
      const response = await request(app)
        .post("/api/users/tester/transactions")
        .set(
          "Cookie",
          `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`
        )
        .send(bodyArray[i]);
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: expect.any(String),
      });
    }
  });

  test("should return 200 if the transaction is created successfully", async () => {
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
    const categoriesArray = [
      { type: "food", color: "red" },
      { type: "investment", color: "blue" },
    ];
    await categories.insertMany(categoriesArray);
    await User.insertMany(usersArray);
    const bodyArray = [
      { username: "tester", amount: 35, type: "investment" },
      { username: "tester", amount: 42, type: "food" },
      { username: "admin", amount: 60, type: "food" },
      { username: "admin", amount: 22, type: "food" },
    ];
    for (let i = 0; i < bodyArray.length; i++) {
      const response = await request(app)
        .post("/api/users/tester/transactions")
        .set(
          "Cookie",
          `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`
        )
        .send(bodyArray[i]);
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        data: expect.objectContaining({
          username: expect.any(String),
          amount: expect.any(Number),
          type: expect.any(String),
        }),
      });
    }
  });
});

describe("getAllTransactions", () => {
  test("should return 401 if the user is not authorized", async () => {
    const user = {
      username: "tester",
      email: "tester@test.com",
      password: "tester",
      refreshToken: testerAccessTokenValid,
    };
    await User.create(user);
    const response = await request(app)
      .get("/api/transactions")
      .set(
        "Cookie",
        `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`
      )
      .send();

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: expect.any(String) });
  });

  test("should return 200 with an array with all transactions", async () => {
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
    const categoriesArray = [
      { type: "food", color: "red" },
      { type: "investment", color: "blue" },
    ];
    const transactionsArray = [
      { username: "tester", amount: 35, type: "investment" },
      { username: "tester", amount: 42, type: "food" },
      { username: "admin", amount: 60, type: "food" },
      { username: "admin", amount: 22, type: "food" },
    ];
    await categories.insertMany(categoriesArray);
    await User.insertMany(usersArray);
    await transactions.insertMany(transactionsArray);
    const response = await request(app)
      .get("/api/transactions")
      .set(
        "Cookie",
        `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`
      )
      .send();
    expect(response.status).toBe(200);
    for (let i = 0; i < transactionsArray.length; i++) {
      expect(response.body[i]).toEqual(
        expect.objectContaining({
          _id: expect.any(String),
          username: expect.any(String),
          amount: expect.any(Number),
          type: expect.any(String),
          color: expect.any(String),
          date: expect.any(String),
        })
      );
    }
  });
});

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
  test("should return 401 if the user is not authorized", async () => {
    const userArray = [
      {
        username: "tester",
        email: "tester@test.com",
        password: "tester",
        refreshToken: testerAccessTokenValid,
      },
      {
        username: "admin",
        email: "admin@test.com",
        password: "admin",
        refreshToken: adminAccessTokenValid,
      },
    ];
    await User.insertMany(userArray);
    const user = User.findOne({ username: "tester" });
    const group = {
      name: "testGroup",
      members: [
        {
          email: "tester@test.com",
          user: user._id,
        },
      ],
    };
    await Group.create(group);
    for (let i = 0; i < userArray.length; i++) {
      const url =
        i === 1
          ? "/api/groups/testGroup/transactions"
          : "/api/transactions/groups/testGroup";
      const response = await request(app)
        .get(url)
        .set(
          "Cookie",
          `accessToken=${userArray[i].refreshToken}; refreshToken=${userArray[i].refreshToken}`
        )
        .send();
      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: expect.any(String) });
    }
  });

  test("should return 200 with an array with all transactions of the group", async () => {
    const userArray = [
      {
        username: "tester",
        email: "tester@test.com",
        password: "tester",
        refreshToken: testerAccessTokenValid,
      },
      {
        username: "admin",
        email: "admin@test.com",
        password: "admin",
        refreshToken: adminAccessTokenValid,
      },
    ];
    await User.insertMany(userArray);
    const user = User.findOne({ username: "tester" });
    const group = {
      name: "testGroup",
      members: [
        {
          email: "tester@test.com",
          user: user._id,
        },
      ],
    };
    await Group.create(group);
    const categoriesArray = [
      { type: "food", color: "red" },
      { type: "investment", color: "blue" },
    ];
    const transactionsArray = [
      { username: "tester", amount: 35, type: "investment" },
      { username: "tester", amount: 42, type: "food" },
    ];
    await categories.insertMany(categoriesArray);
    await transactions.insertMany(transactionsArray);

    for (let i = 0; i < userArray.length; i++) {
      const url =
        i === 0
          ? "/api/groups/testGroup/transactions"
          : "/api/transactions/groups/testGroup";
      const response = await request(app)
        .get(url)
        .set(
          "Cookie",
          `accessToken=${userArray[i].refreshToken}; refreshToken=${userArray[i].refreshToken}`
        )
        .send();
      expect(response.status).toBe(200);
      for (let i = 0; i < transactionsArray.length; i++) {
        expect(response.body.data[i]).toEqual(
          expect.objectContaining({
            _id: expect.any(String),
            username: expect.any(String),
            amount: expect.any(Number),
            type: expect.any(String),
            color: expect.any(String),
            date: expect.any(String),
          })
        );
      }
    }
  });
});

describe("getTransactionsByGroupByCategory", () => { 
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
    });
})

describe("deleteTransaction", () => {
  test("should return 401 if the user is not authorized", async () => {
    const user = {
      username: "tester",
      email: "tester@test.com",
      password: "tester",
      refreshToken: testerAccessTokenValid,
    };
    await User.create(user);
    const response = await request(app)
      .delete("/api/users/notTester/transactions")
      .set(
        "Cookie",
        `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`
      )
      .send();

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: expect.any(String) });
  });

  test("should return 400 if the transaction id is invalid", async () => {
    const user = {
      username: "tester",
      email: "tester@test.com",
      password: "tester",
      refreshToken: testerAccessTokenValid,
    };
    await User.create(user);
    const response = await request(app)
      .delete("/api/users/tester/transactions")
      .set(
        "Cookie",
        `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`
      )
      .send();

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Transaction id invalid" });
  });

  test("should return 200 and a message if the transaction is deleted", async () => {
    const user = {
      username: "tester",
      email: "tester@test.com",
      password: "tester",
      role: "Regular",
      refreshToken: testerAccessTokenValid,
    };
    const category = { type: "food", color: "red" };
    const transaction = { username: "tester", amount: 35, type: "food" };
    await categories.create(category);
    await User.create(user);
    await transactions.create(transaction);
    const transactionToDelete = await transactions.findOne({
      username: "tester",
    });
    const response = await request(app)
      .delete("/api/users/tester/transactions")
      .set(
        "Cookie",
        `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`
      )
      .send({ _id: transactionToDelete._id });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: "Transaction deleted" });
  });
});

describe("deleteTransactions", () => { 
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
    });
})
