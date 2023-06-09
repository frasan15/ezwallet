import request from 'supertest';
import { app } from '../app';
import { User } from '../models/User.js';
import jwt from 'jsonwebtoken';
//const bcrypt = require("bcryptjs")
import mongoose, { Model } from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from "bcryptjs";

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

const adminAccessTokenValid = jwt.sign({
  email: "admin@email.com",
  //id: existingUser.id, The id field is not required in any check, so it can be omitted
  username: "admin",
  role: "Admin"
  }, process.env.ACCESS_KEY, { expiresIn: '1y' })
  
  const testerAccessTokenValid = jwt.sign({
  email: "tester@test.com",
  username: "tester",
  role: "Regular"
  }, process.env.ACCESS_KEY, { expiresIn: '1y' })

describe('register', () => {
  test("Should return 400 if request body does not contain all the necessary attributes", async () => {
    const response = await request(app)
      .post("/api/register")
      .send({ username: "test", password: "test"});
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Missing attributes" });
  });

  test("Should return 400 if at least one of the parameters in the request body is an empty string", async () => {
    const response = await request(app)
      .post("/api/register")
      .send({ username: "test", email: "", password: "test"});
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Empty attributes" });
  });

  test("Should return 400 if the email in the request body is not in a valid email format", async () => {
    const response = await request(app)
      .post("/api/register")
      .send({ username: "test", email: "notAnEmail", password: "test"});
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Email is not valid" });
  });

  test("Should return 400 if the username in the request body identifies an already existing user", async () => {
    await User.create({username: "test1", email: "test1@test.com", password: "test"});
    const response = await request(app)
      .post("/api/register")
      .send({ username: "test1", email: "test10@test.com", password: "test"});
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Username is already registered" });
  });

  test("Should return 400 if the email in the request body identifies an already existing user", async () => {
    await User.create({username: "test2", email: "test2@test.com", password: "test"});
    const response = await request(app)
      .post("/api/register")
      .send({ username: "test3", email: "test2@test.com", password: "test"});
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Email is already registered" });
  });

  test("Should return 200 if the user is added successfully", async () => {
    await User.create({username: "test3", email: "test3@test.com", password: "test"});
    const response = await request(app)
      .post("/api/register")
      .send({ username: "test4", email: "test4@test.com", password: "test"});
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: "user added succesfully" });
  });
});

describe("registerAdmin", () => { 
  test("Should return 400 if request body does not contain all the necessary attributes", async () => {
    const response = await request(app)
      .post("/api/admin")
      .send({ username: "test", password: "test"});
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Missing attributes" });
  });

  test("Should return 400 if at least one of the parameters in the request body is an empty string", async () => {
    const response = await request(app)
      .post("/api/admin")
      .send({ username: "test", email: "", password: "test"});
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Empty attributes" });
  });

  test("Should return 400 if the email in the request body is not in a valid email format", async () => {
    const response = await request(app)
      .post("/api/admin")
      .send({ username: "test", email: "notAnEmail", password: "test"});
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Email is not valid" });
  });

  test("Should return 400 if the username in the request body identifies an already existing user", async () => {
    await User.create({username: "test1", email: "test1@test.com", password: "test"});
    const response = await request(app)
      .post("/api/admin")
      .send({ username: "test1", email: "test10@test.com", password: "test"});
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Username is already registered" });
  });

  test("Should return 400 if the email in the request body identifies an already existing user", async () => {
    await User.create({username: "test2", email: "test2@test.com", password: "test"});
    const response = await request(app)
      .post("/api/admin")
      .send({ username: "test3", email: "test2@test.com", password: "test"});
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Email is already registered" });
  });

  test("Should return 200 if the user is added successfully", async () => {
    await User.create({username: "test3", email: "test3@test.com", password: "test"});
    const response = await request(app)
      .post("/api/admin")
      .send({ username: "test4", email: "test4@test.com", password: "test"});
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: "admin added succesfully" });
  });
})

describe('login', () => { 
  test("login performed succesfully", async() => {
    const password = "admin"
    const hashedPassword = await bcrypt.hash(password, 12);

    await User.insertMany([{username: "santoro",
    email: "admin@email.com",
    password: hashedPassword,
    refreshToken: adminAccessTokenValid,
    role: "Admin"}]);

    const response = await request(app)
          .post("/api/login")
          .send({email: "admin@email.com", password: "admin"})

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveProperty("accessToken");
    expect(response.body.data).toHaveProperty("refreshToken");

  });

  test("Returns a 400 error if the request body does not contain all the necessary attributes", async() => {
    const response = await request(app)
          .post("/api/login")
          .send({email: "admin@email.com"})

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error", "missing parameters");
  })

  test("Returns a 400 error if the email in the request body is not in a valid email format", async () => {
    const response = await request(app)
          .post("/api/login")
          .send({email: "adminemail.com", password: "admin"})

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error", "invalid email format");
  });

  test("Returns a 400 error if at least one of the parameters in the request body is an empty string", async () => {
    const response = await request(app)
          .post("/api/login")
          .send({email: "adminemail.com", password: "  "})

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error", "Empty string. Write correct information to login");
  });

  test("Returns a 400 error if the email in the request body does not identify a user in the database", async() => {
    const response = await request(app)
          .post("/api/login")
          .send({email: "admin@email.com", password: "admin"})

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error", "please you need to register");
  });

  test("Returns a 400 error if the supplied password does not match with the one in the database", async() => {
    const password = "admin"
    const hashedPassword = await bcrypt.hash(password, 12);

    await User.insertMany([{username: "santoro",
    email: "admin@email.com",
    password: hashedPassword,
    refreshToken: adminAccessTokenValid,
    role: "Admin"}]);

    const response = await request(app)
          .post("/api/login")
          .send({email: "admin@email.com", password: "wrongPassword"})

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error", "wrong credentials");
  })
});

describe("logout", () => {
	const testerAccessTokenValid = jwt.sign(
		{
			email: "test@example.com",
			username: "test",
			role: "Regular",
		},
		process.env.ACCESS_KEY,
		{ expiresIn: "1y" }
	);

	test("should log out a user and return success message", async () => {
		await User.insertMany([
			{ username: "test", email: "test@example.com", password: "test", refreshToken: testerAccessTokenValid },
		]);

		const response = await request(app)
			.get("/api/logout")
			.set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`);

		expect(response.status).toBe(200);
		expect(response.body).toEqual({ data: { error: "User logged out" } });
	});

	test("should return an error if user is not found", async () => {
		const testerAccessTokenEmpty = jwt.sign({}, process.env.ACCESS_KEY, { expiresIn: "1y" });

		const response = await request(app)
			.get("/api/logout")
			.set("Cookie", `accessToken=${testerAccessTokenEmpty}; refreshToken=${testerAccessTokenEmpty}`);

		expect(response.status).toBe(400);
		expect(response.body).toEqual({ error: "user not found" });
	});

	test("should return an error if refresh token is not found", async () => {
		const response = await request(app).get("/api/logout").set("Cookie", `accessToken=${testerAccessTokenValid}`);

		expect(response.status).toBe(400);
		expect(response.body).toEqual({ error: "user not found" });
	});
});
