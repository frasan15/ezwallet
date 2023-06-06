import request from 'supertest';
import { app } from '../app';
import { User } from '../models/User.js';
import jwt from 'jsonwebtoken';
const bcrypt = require("bcryptjs")
import mongoose, { Model } from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

beforeAll(async () => {
  const dbName = "testingDatabaseAuth";
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
  await User.deleteMany({});
  jest.clearAllMocks();
});

describe('register', () => {
  test.only("Should return 400 if request body does not contain all the necessary attributes", async () => {
    const response = await request(app)
      .post("/api/register")
      .send({ username: "test", password: "test"});
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Missing attributes" });
  });

  test.only("Should return 400 if at least one of the parameters in the request body is an empty string", async () => {
    const response = await request(app)
      .post("/api/register")
      .send({ username: "test", email: "", password: "test"});
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Empty attributes" });
  });

  test.only("Should return 400 if the email in the request body is not in a valid email format", async () => {
    const response = await request(app)
      .post("/api/register")
      .send({ username: "test", email: "notAnEmail", password: "test"});
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Email is not valid" });
  });

  test.only("Should return 400 if the username in the request body identifies an already existing user", async () => {
    await User.create({username: "test1", email: "test1@test.com", password: "test"});
    const response = await request(app)
      .post("/api/register")
      .send({ username: "test1", email: "test10@test.com", password: "test"});
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Username is already registered" });
  });

  test.only("Should return 400 if the email in the request body identifies an already existing user", async () => {
    await User.create({username: "test2", email: "test2@test.com", password: "test"});
    const response = await request(app)
      .post("/api/register")
      .send({ username: "test3", email: "test2@test.com", password: "test"});
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Email is already registered" });
  });

  test.only("Should return 200 if the user is added successfully", async () => {
    await User.create({username: "test3", email: "test3@test.com", password: "test"});
    const response = await request(app)
      .post("/api/register")
      .send({ username: "test4", email: "test4@test.com", password: "test"});
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: "user added succesfully" });
  });
});

describe("registerAdmin", () => { 
  test.only("Should return 400 if request body does not contain all the necessary attributes", async () => {
    const response = await request(app)
      .post("/api/admin")
      .send({ username: "test", password: "test"});
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Missing attributes" });
  });

  test.only("Should return 400 if at least one of the parameters in the request body is an empty string", async () => {
    const response = await request(app)
      .post("/api/admin")
      .send({ username: "test", email: "", password: "test"});
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Empty attributes" });
  });

  test.only("Should return 400 if the email in the request body is not in a valid email format", async () => {
    const response = await request(app)
      .post("/api/admin")
      .send({ username: "test", email: "notAnEmail", password: "test"});
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Email is not valid" });
  });

  test.only("Should return 400 if the username in the request body identifies an already existing user", async () => {
    await User.create({username: "test1", email: "test1@test.com", password: "test"});
    const response = await request(app)
      .post("/api/admin")
      .send({ username: "test1", email: "test10@test.com", password: "test"});
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Username is already registered" });
  });

  test.only("Should return 400 if the email in the request body identifies an already existing user", async () => {
    await User.create({username: "test2", email: "test2@test.com", password: "test"});
    const response = await request(app)
      .post("/api/admin")
      .send({ username: "test3", email: "test2@test.com", password: "test"});
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Email is already registered" });
  });

  test.only("Should return 200 if the user is added successfully", async () => {
    await User.create({username: "test3", email: "test3@test.com", password: "test"});
    const response = await request(app)
      .post("/api/admin")
      .send({ username: "test4", email: "test4@test.com", password: "test"});
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: "admin added succesfully" });
  });
})

describe('login', () => { 
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
    });
});

describe('logout', () => { 
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
    });
});
