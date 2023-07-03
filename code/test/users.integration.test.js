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

const testerAccessTokenExpired = jwt.sign({
  email: "tester@test.com",
  username: "tester",
  role: "Regular"
}, process.env.ACCESS_KEY, { expiresIn: '0s' })

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

describe("getUser", () => {
  test("Returns requested user", async () => {
    const user = {
      username: "tester",
      email: "tester@test.com",
      password: "tester",
      role: "Regular",
      refreshToken: testerAccessTokenValid,
    };
    await User.create(user);

    //The API request must be awaited as well
    const response = await request(app)
      .get("/api/users/tester")
      .set(
        "Cookie",
        `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`
      )
      .send({
        params: {
          username: "tester",
        },
      });
    expect(response.status).toBe(200);
    expect(response.body.data.username).toEqual(user.username);
    expect(response.body.data.email).toEqual(user.email);
    expect(response.body.data.role).toEqual(user.role);
  });
  test("Returns a 400 error if the username passed as the route parameter does not represent a user in the database", async () => {
    const admin = {
      username: "admin",
      email: "admin@email.com",
      password: "admin",
      refreshToken: adminAccessTokenValid,
      role: "Admin",
    };

    await User.create(admin);

    //The API request must be awaited as well
    const response = await request(app)
      .get("/api/users/tester")
      .set(
        "Cookie",
        `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`
      )
      .send();
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
  });
  test("Returns a 401 error if called by an authenticated user who is neither the same user as the one in the route parameter (authType = User) nor an admin (authType = Admin)", async () => {
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

    const response = await request(app)
      .get("/api/users/admin")
      .set(
        "Cookie",
        `accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`
      )
      .send();
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("error");
  });
});

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

describe("removeFromGroup", () => {
  test("Should return 401 unauthorized if not an admin or group member", async () => {
    const user = {
      username: "tester",
      email: "tester@test.com",
      password: "tester",
      role: "Regular",
      refreshToken: testerAccessTokenValid,
    };
    await User.create(user);
    await Group.insertMany({name: "group1" , members: { email: "Neda@yahoo.com"}})
    const response = await request(app)
    .patch("/api/groups/group1/pull")
    .set("Cookie",`accessToken=${testerAccessTokenValid}; refreshToken=${testerAccessTokenValid}`)
    .send({ username: "tester" , emails: "Neda@polito.it" });
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("error");
  })
  test("Should return 400 error if the request body does not contain all the necessary attributes", async()=>{
    const user = {
      username: "admin",
      email: "admin@test.com",
      password: "admin",
      role: "admin",
      refreshToken: adminAccessTokenValid,
    };
    await User.create(user);
    await Group.insertMany({name: "group1" , members: { email: "Neda@yahoo.com"}})
    const response = await request(app)
    .patch("/api/groups/group1/pull")
    .set("Cookie",`accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
    .send({ username: "admin"});
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
  })
  test("Should return 400 error if the the format of email is not correct", async()=>{
    const user = {
      username: "admin",
      email: "admin@test.com",
      password: "admin",
      role: "Admin",
      refreshToken: adminAccessTokenValid,
    };
    await User.create(user);
    await Group.insertMany({name: "group1" , members: { email: "Neda@yahoo.com"}})
    const response = await request(app)
    .patch("/api/groups/group1/pull")
    .set("Cookie",`accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
    .send({ username: "admin", emails: ["hjdfhkjdsh98898"]});
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
  })
  test ("400 error if the group name passed as a route parameter does not represent a group in the database " , async()=> {
    const user = {
      username: "admin",
      email: "admin@test.com",
      password: "admin",
      role: "Admin",
      refreshToken: adminAccessTokenValid,
    };
    await User.create(user);
    await Group.insertMany({name: "group2" , members: { email: "Neda@yahoo.com"}})
    const response = await request(app)
    .patch("/api/groups/group1/pull")
    .set("Cookie",`accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
    .send({ username: "admin" , emails: "Neda@polito.it"});
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
  })
  test('Should return 400 error if at least one of the emails is an empty string' , async()=>{
    const user = {
      username: "admin",
      email: "admin@test.com",
      password: "admin",
      role: "Admin",
      refreshToken: adminAccessTokenValid,
    };
    await User.create(user);
    await Group.insertMany({name: "group22" , members: [{ email: "Neda@yahoo.com"}]},
    {name: "group2" , members: [{ email: "Neda@yahoo.com"}]})
    const response = await request(app)
    .patch("/api/groups/group1/pull")
    .set("Cookie",`accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
    .send({ username: "admin" , emails: " "});
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
  })
  test('Should return 401 when trying to remove a member who is not part of the group', async () => {
    const user = ([{
      username: "tester",
      email: "tester@test.com",
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
  test ("Should Return  400 error if group is not exist ", async()=>{
    const user ={
      username: "admin",
      email: "admin@email.com",
      password: "admin",
      role: "Admin",
      refreshToken: adminAccessTokenValid,
  } 
  await User.create(user)
  await Group.insertMany({name: "Family" , members:{email: "email1@polito.com"}})
  const response = await request(app)
  .delete("/api/groups")
  .set("Cookie",`accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`)
  .send({username:"admin" , name: "group1"})
  expect(response.status).toBe(400);
  expect(response.body).toEqual({ error: expect.any(String) })
  })
});

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
    expect(response.body.data.deletedTransactions).toEqual(2);
    expect(response.body.data.deletedFromGroup).toEqual(true);
    const deletedGroup = await Group.findOne({ name: "testGroup" });
    expect(deletedGroup).toEqual(null);
  });
});

describe("deleteGroup", () => {
  test("Group has been successfully deleted", async () => {
    const user = {
      username: "admin",
      email: "admin@email.com",
      password: "admin",
      role: "Admin",
      refreshToken: adminAccessTokenValid,
    };
    await User.create(user);
    await Group.insertMany(
      { name: "Family", members: { email: "email1@polito.com" } },
      { name: "group2", members: { email: "email2@polito.it" } }
    );
    const response = await request(app)
      .delete("/api/groups")
      .set(
        "Cookie",
        `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`
      )
      .send({ username: "admin", name: "Family" });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: { message: "the group has been correctly deleted" } });
  });
  test("Should Return 400, if User is not Authorized", async () => {
    const user = {
      username: "tester",
      email: "tester@email.com",
      password: "tester",
      role: "regular",
      refreshToken: testerAccessTokenValid,
    };
    await User.create(user);
    const response = await request(app)
      .delete("/api/groups")
      .send({ username: "tester", types: ["Family"] });
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: expect.any(String) });
  });
  test("Should return 400 if the request body does not contain all the necessary attributes", async () => {
    const user = {
      username: "admin",
      email: "admin@email.com",
      password: "admin",
      role: "Admin",
      refreshToken: adminAccessTokenValid,
    };
    await User.create(user);
    const response = await request(app)
      .delete("/api/groups")
      .set(
        "Cookie",
        `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`
      )
      .send({ username: "admin" });
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: expect.any(String) });
  });
  test("Should Returns a 400 error if the name passed in the request body is an empty string", async () => {
    const user = {
      username: "admin",
      email: "admin@email.com",
      password: "admin",
      role: "Admin",
      refreshToken: adminAccessTokenValid,
    };
    await User.create(user);
    const response = await request(app)
      .delete("/api/groups")
      .set(
        "Cookie",
        `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`
      )
      .send({ username: "admin", name: " " });
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: expect.any(String) });
  });
  test("Should Return  400 error if group is not exist ", async () => {
    const user = {
      username: "admin",
      email: "admin@email.com",
      password: "admin",
      role: "Admin",
      refreshToken: adminAccessTokenValid,
    };
    await User.create(user);
    await Group.insertMany({
      name: "Family",
      members: { email: "email1@polito.com" },
    });
    const response = await request(app)
      .delete("/api/groups")
      .set(
        "Cookie",
        `accessToken=${adminAccessTokenValid}; refreshToken=${adminAccessTokenValid}`
      )
      .send({ username: "admin", name: "group1" });
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: expect.any(String) });
  });
});