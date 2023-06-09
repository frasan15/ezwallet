import request from 'supertest';
import { app } from '../app';
import { categories, transactions } from '../models/model';
import { User, Group } from '../models/User.js';
import mongoose, { Model } from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

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

//necessary setup to ensure that each test can insert the data it needs
beforeEach(async () => {
    await categories.deleteMany({})
    await transactions.deleteMany({})
    await User.deleteMany({})
    await Group.deleteMany({})
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

const testerAccessTokenExpired = jwt.sign({
email: "tester@test.com",
username: "tester",
role: "Regular"
}, process.env.ACCESS_KEY, { expiresIn: '0s' })

describe("createCategory", () => { 
    test("category correctly created", async() => {
        await User.insertMany([{
            username: "francesco",
            email: "mario.red@email.com",
            password: "password",
            refreshToken: testerAccessTokenValid
          }, {
            username: "santoro",
            email: "luigi.red@email.com",
            password: "admin",
            refreshToken: adminAccessTokenValid,
            role: "Admin"
          }]);
        
          await categories.insertMany([{
            type: "family",
            color: "blue"
          }])

          const response = await request(app)
          .post("/api/categories")
          .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
          .send({type: "friends", color: "yellow"})

          expect(response.status).toBe(200)
          expect(response.body.data).toHaveProperty("type", "friends")
          expect(response.body.data).toHaveProperty("color", "yellow")
    });

    test("Returns a 400 error if the type of category passed in the request body represents an already existing category in the database", async() => {
        await User.insertMany([{
            username: "francesco",
            email: "mario.red@email.com",
            password: "password",
            refreshToken: testerAccessTokenValid
          }, {
            username: "santoro",
            email: "luigi.red@email.com",
            password: "admin",
            refreshToken: adminAccessTokenValid,
            role: "Admin"
          }]);
        
          await categories.insertMany([{
            type: "family",
            color: "blue"
          }])

          const response = await request(app)
          .post("/api/categories")
          .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
          .send({type: "family", color: "yellow"})

          expect(response.status).toBe(400)
          expect(response.body).toHaveProperty("error", "category already exist")
    });

    test("Returns a 400 error if the request body does not contain all the necessary attributes", async() => {
      await User.insertMany([{
          username: "francesco",
          email: "mario.red@email.com",
          password: "password",
          refreshToken: testerAccessTokenValid
        }, {
          username: "santoro",
          email: "luigi.red@email.com",
          password: "admin",
          refreshToken: adminAccessTokenValid,
          role: "Admin"
        }]);
      
        await categories.insertMany([{
          type: "family",
          color: "blue"
        }])

        const response = await request(app)
        .post("/api/categories")
        .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
        .send({type: "friends"})

        expect(response.status).toBe(400)
        expect(response.body).toHaveProperty("error", "Missing or wrong parameters")
  });

  test("eturns a 400 error if at least one of the parameters in the request body is an empty string", async() => {
    await User.insertMany([{
        username: "francesco",
        email: "mario.red@email.com",
        password: "password",
        refreshToken: testerAccessTokenValid
      }, {
        username: "santoro",
        email: "luigi.red@email.com",
        password: "admin",
        refreshToken: adminAccessTokenValid,
        role: "Admin"
      }]);
    
      await categories.insertMany([{
        type: "family",
        color: "blue"
      }])

      const response = await request(app)
      .post("/api/categories")
      .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
      .send({type: "friends", color: "  "})

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty("error", "empty string not acceptable")
});

    test("returns a 401 error if called by an authenticated user who is not an admin (authType = Admin)", async() => {
        await User.insertMany([{
            username: "francesco",
            email: "mario.red@email.com",
            password: "password",
            refreshToken: testerAccessTokenValid
          }])
        
          await categories.insertMany([{
            type: "family",
            color: "blue"
          }])

          const response = await request(app)
          .post("/api/categories")
          .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)
          .send({type: "friends", color: "yellow"})

          expect(response.status).toBe(401)
          expect(response.body).toHaveProperty("error", "Unauthorized")  

          
    })
})

describe("updateCategory", () => { 

})

describe("deleteCategory", () => { 

})

describe("getCategories", () => { 
    test("categories correctly returned", async() => {
        await User.insertMany([{
            username: "francesco",
            email: "mario.red@email.com",
            password: "password",
            refreshToken: testerAccessTokenValid
          }])
        
          await categories.insertMany([{
            type: "family",
            color: "blue"
          }, {
            type: "cousins",
            color: "red"
          }])

          const response = await request(app)
          .get("/api/categories")
          .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)
          .send()

          expect(response.status).toBe(200)
          expect(response.body.data[0]).toHaveProperty("type", "family")
          expect(response.body.data[0]).toHaveProperty("color", "blue")
          expect(response.body.data[1]).toHaveProperty("type", "cousins")
          expect(response.body.data[1]).toHaveProperty("color", "red")
    });

    test("Returns a 401 error if called by a user who is not authenticated (authType = Simple)", async() => {
        const cookie = "invalidToken"
        const response = await request(app)
        .get("/api/categories")
        .set("Cookie", `accessToken=${cookie}; refreshToken=${cookie}`)
        .send()

        expect(response.status).toBe(401)
        expect(response.body).toHaveProperty("error", "Unauthorized")
    });
})

describe("createTransaction", () => { 

})

describe("getAllTransactions", () => { 

})

describe("getTransactionsByUser", () => { 

})

describe("getTransactionsByUserByCategory", () => { 

})

describe("getTransactionsByGroup", () => { 

})

describe("getTransactionsByGroupByCategory", () => { 

})

describe("deleteTransaction", () => { 

})

describe("deleteTransactions", () => { 

})
