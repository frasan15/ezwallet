import request from 'supertest';
import { app } from '../app';
import { User, Group } from '../models/User.js';
import { transactions, categories } from '../models/model';
import mongoose, { Model } from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { response } from 'express';

/**
 * Necessary setup in order to create a new database for testing purposes before starting the execution of test cases.
 * Each test suite has its own database in order to avoid different tests accessing the same database at the same time and expecting different data.
 */
dotenv.config();

beforeAll(async () => {
  const dbName = "testingDatabaseController";
  const url = `${process.env.MONGO_URI}/${dbName}`;

  await mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
});

/**
 * After all test cases have been executed the database is deleted.
 * This is done so that subsequent executions of the test suite start with an empty database.
 */
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

describe("getUsers", () => {})

describe("getUser", () => { })

describe("createGroup", () => {
  test("all members added correctly, except for one of them who does not exist and the other who already belongs to another group", async() => {
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
    },
    {
      username: "tester",
      email: "tester@test.com",
      password: "tester",
      refreshToken: testerAccessTokenValid
    },
    {
      username: "francesco1",
      email: "francesco@polito.it",
      password: "password",
      refreshToken: testerAccessTokenValid
    }])

    await Group.insertMany([{
      name: "Friends",
      members: [{email: "francesco@polito.it"}, {email: "santoro@polito.it"}]
    }
    ])
     
    const response = await request(app)
          .post("/api/groups")
          .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)
          .send({name: "Family", memberEmails: ["mario.red@email.com", "luigi.red@email.com", "francesco@polito.it", "marcello@polito.it"]})
    
    expect(response.status).toBe(200)
    expect(response.body.data.group).toHaveProperty("name", "Family")
    expect(response.body.data.group.members[0]).toHaveProperty("email", "mario.red@email.com")
    expect(response.body.data.group.members[1]).toHaveProperty("email", "luigi.red@email.com")
    expect(response.body.data.group.members[2]).toHaveProperty("email", "tester@test.com")
    expect(response.body.data.membersNotFound[0]).toHaveProperty("email", "marcello@polito.it")
    expect(response.body.data.alreadyInGroup[0]).toHaveProperty("email", "francesco@polito.it")
  });

  test("all members correctly added, the user's email who is calling the API is already present in the request's members array", async() => {
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
    },
    {
      username: "tester",
      email: "tester@test.com",
      password: "tester",
      refreshToken: testerAccessTokenValid
    },
    {
      username: "francesco1",
      email: "francesco@polito.it",
      password: "password",
      refreshToken: testerAccessTokenValid
    }])
    
    await Group.insertMany([{
      name: "Friends",
      members: [{email: "francesco@polito.it"}, {email: "santoro@polito.it"}]
    }
    ])

    const response = await request(app)
    .post("/api/groups")
    .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)
    .send({name: "Family", memberEmails: ["mario.red@email.com", "luigi.red@email.com", "tester@test.com"]})

    expect(response.status).toBe(200)
    expect(response.body.data.group).toHaveProperty("name", "Family")
    expect(response.body.data.group.members[0]).toHaveProperty("email", "mario.red@email.com")
    expect(response.body.data.group.members[1]).toHaveProperty("email", "luigi.red@email.com")
    expect(response.body.data.group.members[2]).toHaveProperty("email", "tester@test.com")
  });

  test("Returns a 400 error if the request body does not contain all the necessary attributes", async() => {
    const response = await request(app)
          .post("/api/groups")
          .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)
          .send({memberEmails: ["mario.red@email.com", "luigi.red@email.com", "tester@test.com"]})

    expect(response.status).toBe(400)
    expect(response.body).toHaveProperty("error")

  });

  test("Returns a 400 error if the group name passed in the request body represents an already existing group in the database", async() => {
    await Group.insertMany([{
      name: "Friends",
      members: [{email: "francesco@polito.it"}, {email: "santoro@polito.it"}]
    }
    ])

    const response = await request(app)
    .post("/api/groups")
    .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)
    .send({name: "Friends", memberEmails: ["mario.red@email.com", "luigi.red@email.com", "tester@test.com"]})

    expect(response.status).toBe(400)
    expect(response.body).toHaveProperty("error", "Group already exists")
  });

  test("Returns a 400 error if the group name passed in the request body is an empty string", async() => {
    await Group.insertMany([{
      name: "Friends",
      members: [{email: "francesco@polito.it"}, {email: "santoro@polito.it"}]
    }
    ])

    const response = await request(app)
    .post("/api/groups")
    .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)
    .send({name: "  ", memberEmails: ["mario.red@email.com", "luigi.red@email.com", "tester@test.com"]})

    expect(response.status).toBe(400)
    expect(response.body).toHaveProperty("error", "the name of the group cannot be empty")
  });

  test("Returns a 400 error if all the provided emails represent users that are already in a group or do not exist in the database", async() => {
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
    }])

    await Group.insertMany([{
      name: "Friends",
      members: [{email: "mario.red@email.com"}, {email: "luigi.red@email.com"}]
    }
    ])

    const response = await request(app)
    .post("/api/groups")
    .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)
    .send({name: "Family", memberEmails: ["mario.red@email.com", "luigi.red@email.com", "marco@test.com"]})

    expect(response.status).toBe(400)
    expect(response.body).toHaveProperty("error", "All users already in group or none were found in system")
  });

  test("Returns a 400 error if the user who calls the API is already in a group", async() => {
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
    }])

    await Group.insertMany([{
      name: "Friends",
      members: [{email: "tester@test.com"}, {email: "luigi.red@email.com"}]
    }
    ])

    const response = await request(app)
    .post("/api/groups")
    .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)
    .send({name: "Family", memberEmails: ["mario.red@email.com", "luigi.red@email.com", "marco@test.com"]})

    expect(response.status).toBe(400)
    expect(response.body).toHaveProperty("error", "the user who is trying to create the group is already in another group")
  });

  test("Returns a 400 error if at least one of the member emails is not in a valid email format", async() => {
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
    }])

    await Group.insertMany([{
      name: "Friends",
      members: [{email: "luigi.red@email.com"}]
    }
    ])

    const response = await request(app)
    .post("/api/groups")
    .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)
    .send({name: "Family", memberEmails: ["mario.redemail.com", "   ", "marco@test.com"]})

    expect(response.status).toBe(400)
    expect(response.body).toHaveProperty("error", "one or more emails are either written in a wrong format or empty")
  });

  test("Returns a 401 error if called by a user who is not authenticated (authType = Simple)", async() => {
    const response = await request(app)
    .post("/api/groups")
    .set("Cookie", `accessToken=${testerAccessTokenExpired}; refreshToken=${testerAccessTokenExpired}`)
    .send({name: "Family", memberEmails: ["mario.red@email.com", "marco@test.com"]})

    expect(response.status).toBe(401)
    expect(response.body).toHaveProperty("error", "Unauthorized")
  });
 })

describe("getGroups", () => {
  test("it returns correctly the two groups", async () => {
    await User.insertMany([{
      username: "tester",
      email: "tester@test.com",
      password: "tester",
      refreshToken: testerAccessTokenValid
  }, {
      username: "admin",
      email: "admin@email.com",
      password: "admin",
      refreshToken: adminAccessTokenValid,
      role: "Admin"
  }])
    await Group.insertMany([{
      name: "Family", 
      members: [{email: "mario.red@email.com"}, {email: "luigi.red@email.com"}]
    }, {
      name: "Friends",
      members: [{email: "francesco@polito.it"}, {email: "santoro@polito.it"}]
    }
  ]) 

  const response = await request(app)
        .get("/api/groups")
        .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
        .send()

  expect(response.status).toBe(200)
  expect(response.body.data[0]).toHaveProperty("name", "Family")
  expect(response.body.data[0]).toHaveProperty("members", [{email: "mario.red@email.com"}, {email: "luigi.red@email.com"}])
  expect(response.body.data[1]).toHaveProperty("name", "Friends")
  expect(response.body.data[1]).toHaveProperty("members", [{email: "francesco@polito.it"}, {email: "santoro@polito.it"}])
  })

  test("it returns empty list if there are no groups", async () => {
  const response = await request(app)
        .get("/api/groups")
        .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
        .send()

  expect(response.status).toBe(200)
  expect(response.body.data).toHaveLength(0);
  })

  test("Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin)", async() => {
  const response = await request(app)
        .get("/api/groups")
        .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)
        .send()

  expect(response.status).toBe(401)
  expect(response.body).toHaveProperty("error")
  })
    
})

describe("getGroup", () => {
  test("It returns the requested group if called by an Admin", async() => {
    await Group.insertMany([{
      name: "Family", 
      members: [{email: "mario.red@email.com"}, {email: "luigi.red@email.com"}]
    }, {
      name: "Friends",
      members: [{email: "francesco@polito.it"}, {email: "santoro@polito.it"}]
    }
  ]) 

  const response = await request(app)
        .get("/api/groups/Family")
        .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
        .send()

  expect(response.status).toBe(200)
  expect(response.body.data.group).toHaveProperty("name", "Family")
  expect(response.body.data.group).toHaveProperty("members", [{email: "mario.red@email.com"}, {email: "luigi.red@email.com"}])
  });

  test("It returns the requested group if called by a regular user who is part of the group", async() => {
    await Group.insertMany([{
      name: "Family", 
      members: [{email: "mario.red@email.com"}, {email: "luigi.red@email.com"}, {email: "tester@test.com"}]
    }, {
      name: "Friends",
      members: [{email: "francesco@polito.it"}, {email: "santoro@polito.it"}]
    }
  ]) 

  const response = await request(app)
        .get("/api/groups/Family")
        .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)
        .send()

  expect(response.status).toBe(200)
  expect(response.body.data.group).toHaveProperty("name", "Family")
  expect(response.body.data.group).toHaveProperty("members", [{email: "mario.red@email.com"}, {email: "luigi.red@email.com"}, {email: "tester@test.com"}])
  });
 

 test("it returns 400 error if the requested group does not exist", async() => {
  const response = await request(app)
        .get("/api/groups/Family")
        .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
        .send()
  expect(response.status).toBe(400)
  expect(response.body).toHaveProperty("error")
 });

 test("it returns 401 error if called by a regular user who is not part of the group", async() => {
  await Group.insertMany([{
    name: "Family", 
    members: [{email: "mario.red@email.com"}, {email: "luigi.red@email.com"}]
  }])

  const response = await request(app)
        .get("/api/groups/Family")
        .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)
        .send()

  expect(response.status).toBe(401)
  expect(response.body).toHaveProperty("error")
 });

});

describe("addToGroup", () => {
  test("Method called by an admin, returned with success", async() => {
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
    },
    {
      username: "tester",
      email: "tester@test.com",
      password: "tester",
      refreshToken: testerAccessTokenValid
    },
    {
      username: "francesco1",
      email: "francesco@polito.it",
      password: "password",
      refreshToken: testerAccessTokenValid
    }])

    const group = {
      name: "Friends",
      members: [{email: "santoro@polito.it"}]
    };

    const group1 = {
      name: "No_friends",
      members: [{email: "francesco@polito.it"}]
    }

    await Group.insertMany([group, group1])
     
    const response = await request(app)
          .patch(`/api/groups/${group.name}/insert`)
          .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
          .send({emails: ["mario.red@email.com", "luigi.red@email.com", "francesco@polito.it", "marcello@polito.it"]})
    
    expect(response.status).toBe(200)
    expect(response.body.data.group).toHaveProperty("name", `${group.name}`)
    expect(response.body.data.group.members[0]).toHaveProperty("email", "santoro@polito.it")
    expect(response.body.data.group.members[1]).toHaveProperty("email", "mario.red@email.com")
    expect(response.body.data.group.members[2]).toHaveProperty("email", "luigi.red@email.com")
    expect(response.body.data.membersNotFound[0]).toEqual("marcello@polito.it")
    expect(response.body.data.alreadyInGroup[0]).toEqual("francesco@polito.it")
  });

  test("Method called by a regular user belonging to the requested group, returned with success", async() => {
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
    },
    {
      username: "tester",
      email: "tester@test.com",
      password: "tester",
      refreshToken: testerAccessTokenValid
    },
    {
      username: "francesco1",
      email: "francesco@polito.it",
      password: "password",
      refreshToken: testerAccessTokenValid
    }])

    const group = {
      name: "Friends",
      members: [{email: "santoro@polito.it"}, {email: "tester@test.com"}]
    };

    const group1 = {
      name: "No_friends",
      members: [{email: "francesco@polito.it"}]
    }

    await Group.insertMany([group, group1])
     
    const response = await request(app)
          .patch(`/api/groups/${group.name}/add`)
          .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)
          .send({emails: ["luigi.red@email.com", "francesco@polito.it", "marcello@polito.it"]})
    
    expect(response.status).toBe(200)
    expect(response.body.data.group).toHaveProperty("name", `${group.name}`)
    expect(response.body.data.group.members[0]).toHaveProperty("email", "santoro@polito.it")
    expect(response.body.data.group.members[1]).toHaveProperty("email", "tester@test.com")
    expect(response.body.data.group.members[2]).toHaveProperty("email", "luigi.red@email.com")
    expect(response.body.data.membersNotFound[0]).toEqual("marcello@polito.it")
    expect(response.body.data.alreadyInGroup[0]).toEqual("francesco@polito.it")
  });

  test("Returns a 400 error if the group name passed as a route parameter does not represent a group in the database", async() => {
    const response = await request(app)
    .patch(`/api/groups/Franco/insert`)
    .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
    .send({emails: ["luigi.red@email.com", "francesco@polito.it", "marcello@polito.it"]})

    expect(response.status).toBe(400)
    expect(response.body).toHaveProperty("error", "Group does not exist. Create it first.")
  });

  test("Returns a 400 error if all the provided emails represent users that are already in a group or do not exist in the database", async() => {
    await User.insertMany([
    {
      username: "tester",
      email: "tester@test.com",
      password: "tester",
      refreshToken: testerAccessTokenValid
    },
    {
      username: "francesco1",
      email: "francesco@polito.it",
      password: "password",
      refreshToken: testerAccessTokenValid
    }])

    const group = {
      name: "Friends",
      members: [{email: "santoro@polito.it"}, {email: "tester@test.com"}]
    };

    const group1 = {
      name: "No_friends",
      members: [{email: "francesco@polito.it"}]
    }

    await Group.insertMany([group, group1])
     
    const response = await request(app)
          .patch(`/api/groups/${group.name}/insert`)
          .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
          .send({emails: ["francesco@polito.it", "marcello@polito.it"]})
    
    expect(response.status).toBe(400)
    expect(response.body).toHaveProperty("error", "all the provided emails represent users that are already in a group or do not exist in the database")
  });

  test("Returns a 400 error if at least one of the member emails is not in a valid email format", async() => {
    const group = {
      name: "Friends",
      members: [{email: "santoro@polito.it"}, {email: "tester@test.com"}]
    };

    await Group.insertMany([group])
    const response = await request(app)
    .patch(`/api/groups/Friends/insert`)
    .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
    .send({emails: ["francescopolito.it", "marcello@polito.it"]})

    expect(response.status).toBe(400)
    expect(response.body).toHaveProperty("error")
  });

  test("Returns a 401 error if called by an authenticated user who is not part of the group (authType = Group) if the route is `api/groups/:name/add`", async() => {
    const group = {
      name: "Friends",
      members: [{email: "santoro@polito.it"}]
    };

    await Group.insertMany([group])
    const response = await request(app)
    .patch(`/api/groups/Friends/add`)
    .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)
    .send({emails: ["francescopolito.it", "marcello@polito.it"]})

    expect(response.status).toBe(401)
    expect(response.body).toHaveProperty("error", "Unauthorized")
  });

  test("Returns a 401 error if called by an authenticated user who is not an admin (authType = Admin) if the route is `api/groups/:name/insert`", async() => {
    const group = {
      name: "Friends",
      members: [{email: "santoro@polito.it"}, {email: "tester@test.com"}]
    };

    await Group.insertMany([group])
    const response = await request(app)
    .patch(`/api/groups/Friends/insert`)
    .set("Cookie", `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)
    .send({emails: ["francescopolito.it", "marcello@polito.it"]})

    expect(response.status).toBe(401)
    expect(response.body).toHaveProperty("error", "Unauthorized")
  });

  test("Returns a 400 error if the request body does not contain all the necessary attributes", async() => {
    const group = {
      name: "Friends",
      members: [{email: "santoro@polito.it"}, {email: "tester@test.com"}]
    };

    await Group.insertMany([group])
    const response = await request(app)
    .patch(`/api/groups/Friends/insert`)
    .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
    .send({})

    expect(response.status).toBe(400)
    expect(response.body).toHaveProperty("error", "Missing parameters")
  });

  test("Returns a 400 error if at least one of the member emails is an empty string", async() => {
    const group = {
      name: "Friends",
      members: [{email: "santoro@polito.it"}, {email: "tester@test.com"}]
    };

    await Group.insertMany([group])
    const response = await request(app)
    .patch(`/api/groups/Friends/insert`)
    .set("Cookie", `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
    .send({emails: ["francesco@polito.it", "   "]})

    expect(response.status).toBe(400)
    expect(response.body).toHaveProperty("error", "Empty email is not a valid email")
  });
})

describe("removeFromGroup", () => { })

describe("deleteUser", () => { })

describe("deleteGroup", () => { })
