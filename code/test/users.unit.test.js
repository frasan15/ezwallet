import request from 'supertest';
import { app } from '../app';
import { User } from '../models/User.js';
import { Group } from '../models/User.js';
import { createGroup, getGroups, getGroup, addToGroup } from '../controllers/users';
import { verifyAuth } from '../controllers/utils';
import jwt from "jsonwebtoken";
import { isValidEmail } from '../controllers/utils';
import { ObjectId } from 'mongoose';
import mongoose from 'mongoose';
import { Mongoose } from 'mongoose';

/**
 * In order to correctly mock the calls to external modules it is necessary to mock them using the following line.
 * Without this operation, it is not possible to replace the actual implementation of the external functions with the one
 * needed for the test cases.
 * `jest.mock()` must be called for every external module that is called in the functions under test.
 */
jest.mock("bcryptjs")
jest.mock("jsonwebtoken")
jest.mock("../models/User.js")
jest.mock('../models/model.js');

/**
 * Defines code to be executed before each test case is launched
 * In this case the mock implementation of `User.find()` is cleared, allowing the definition of a new mock implementation.
 * Not doing this `mockClear()` means that test cases may use a mock implementation intended for other test cases.
 */
beforeEach(() => {
  User.find.mockClear();
  User.findOne.mockClear();
  User.prototype.save.mockClear();
  User.aggregate.mockClear();
  Group.find.mockClear();
  Group.findOne.mockClear();
  Group.deleteOne.mockClear();
  Group.prototype.save.mockClear();
  
  jest.clearAllMocks();
});

//Necessary step to ensure that the functions in utils.js can be mocked correctly
jest.mock('../controllers/utils.js', () => ({
  verifyAuth: jest.fn(),
  isValidEmail: jest.fn()
}))

describe("getUsers", () => {})

describe("getUser", () => { })

describe("createGroup", () => {
  test.only('creation of the group successfully completed when the email of the user who calls the API is not inside the array', async () => {
    const mockReq = {
        body: {
            name: "group1",
            memberEmails: ["francesco@polito.it", "santoro@polito.it"]
        },
        cookies: {accessToken: "validAccessToken", refreshToken: "validRefreshToken"},
        url: "/api/groups"
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
    const value = {
      email: 'admin@polito.it',
      username: 'santosanto',
      role: 'Admin'}

    jwt.verify.mockReturnValue(value)

    isValidEmail.mockImplementation(() => {
      return true;
    })

    Group.find = jest.fn().mockResolvedValue([])
    Group.findOne = jest.fn().mockResolvedValue(null)
    User.findOne = jest.fn().mockResolvedValue(mockReq.body.memberEmails) 

    const new_value = {name: mockReq.body.name, members: mockReq.body.memberEmails}
    jest.spyOn(Group.prototype, "save").mockResolvedValue(new_value)

    await createGroup(mockReq, mockRes)

    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith(
        {data : {
          group: new_value,
          alreadyInGroup: [],
          membersNotFound: []
        }, 
        refreshedTokenMessage: undefined})
});

test.only("Returns a 400 error if the request body does not contain all the necessary attributes", async() => {
  const mockReq = {
    body: {
        memberEmails: ["francesco@polito.it", "santoro@polito.it"]
    },
    cookies: {accessToken: "bbbi", refreshToken: "bbjbjkb"},
    url: "/api/groups"
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

const value = {
  email: 'admin@polito.it',
  username: 'santosanto',
  role: 'Admin'}

jwt.verify.mockReturnValue(value)

isValidEmail.mockImplementation(() => {
  return true;
})

Group.find = jest.fn().mockResolvedValue([])
Group.findOne = jest.fn().mockResolvedValue(null)
User.findOne = jest.fn().mockResolvedValue(mockReq.body.memberEmails) 

await createGroup(mockReq, mockRes)

expect(mockRes.status).toHaveBeenCalledWith(400)
expect(mockRes.json).toHaveBeenCalledWith(
  {error: expect.any(String)})
})

test.only("Returns a 400 error if the group name passed in the request body is an empty string", async() => {
  const mockReq = {
    body: {
        name: "   ",
        memberEmails: ["francesco@polito.it", "santoro@polito.it"]
    },
    cookies: {accessToken: "bbbi", refreshToken: "bbjbjkb"},
    url: "/api/groups"
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

const value = {
  email: 'admin@polito.it',
  username: 'santosanto',
  role: 'Admin'}

jwt.verify.mockReturnValue(value)

isValidEmail.mockImplementation(() => {
  return true;
})

Group.find = jest.fn().mockResolvedValue([])
Group.findOne = jest.fn().mockResolvedValue(null)
User.findOne = jest.fn().mockResolvedValue(mockReq.body.memberEmails) 

await createGroup(mockReq, mockRes)

expect(mockRes.status).toHaveBeenCalledWith(400)
expect(mockRes.json).toHaveBeenCalledWith(
  {error: expect.any(String)})
})

test.only("Returns a 400 error if the group name passed in the request body represents an already existing group in the database", async() => {
  const mockReq = {
    body: {
        name: "group1",
        memberEmails: ["francesco@polito.it", "santoro@polito.it"]
    },
    cookies: {accessToken: "bbbi", refreshToken: "bbjbjkb"},
    url: "/api/groups"
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

const value = {
  email: 'admin@polito.it',
  username: 'santosanto',
  role: 'Admin'}

jwt.verify.mockReturnValue(value)

isValidEmail.mockImplementation(() => {
  return true;
})

Group.find = jest.fn().mockResolvedValue([])
Group.findOne = jest.fn().mockResolvedValue(mockReq.body.name)
User.findOne = jest.fn().mockResolvedValue(mockReq.body.memberEmails) 

await createGroup(mockReq, mockRes)

expect(mockRes.status).toHaveBeenCalledWith(400)
expect(mockRes.json).toHaveBeenCalledWith(
  {error: expect.any(String)})
})

test.only("Returns a 400 error if all the provided emails represent users that are already in a group or do not exist in the database", async() => {
  const mockReq = {
    body: {
        name: "group1",
        memberEmails: ["francesco@polito.it", "santoro@polito.it"]
    },
    cookies: {accessToken: "bbbi", refreshToken: "bbjbjkb"},
    url: "/api/groups"
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

const value = {
  email: 'admin@polito.it',
  username: 'santosanto',
  role: 'Admin'}

jwt.verify.mockReturnValue(value)

isValidEmail.mockImplementation(() => {
  return true;
})

Group.find = jest.fn().mockResolvedValue([])
Group.findOne = jest.fn().mockResolvedValue(null)
User.findOne = jest.fn().mockResolvedValue(null) 

await createGroup(mockReq, mockRes)

expect(mockRes.status).toHaveBeenCalledWith(400)
expect(mockRes.json).toHaveBeenCalledWith(
  {error: expect.any(String)})
})

test.only("Returns a 400 error if the user who calls the API is already in a group", async() => {
  const mockReq = {
    body: {
        name: "group1",
        memberEmails: ["francesco@polito.it", "santoro@polito.it"]
    },
    cookies: {accessToken: "bbbi", refreshToken: "bbjbjkb"},
    url: "/api/groups"
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

const value = {
  email: 'admin@polito.it',
  username: 'santosanto',
  role: 'Admin'}

jwt.verify.mockReturnValue(value)

isValidEmail.mockImplementation(() => {
  return true;
})

Group.find = jest.fn().mockReturnValue(value)
Group.findOne = jest.fn().mockResolvedValue(null)
User.findOne = jest.fn().mockResolvedValue(null) 

await createGroup(mockReq, mockRes)

expect(mockRes.status).toHaveBeenCalledWith(400)
expect(mockRes.json).toHaveBeenCalledWith(
  {error: expect.any(String)})
})

test.only("Returns a 400 error if at least one of the member emails is not in a valid email format", async() => {
  const mockReq = {
    body: {
        name: "group1",
        memberEmails: ["francescopolito.it", "santoro@polito.it"]
    },
    cookies: {accessToken: "bbbi", refreshToken: "bbjbjkb"},
    url: "/api/groups"
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

const value = {
  email: 'admin@polito.it',
  username: 'santosanto',
  role: 'Admin'}

jwt.verify.mockReturnValue(value)

isValidEmail.mockImplementation(() => {
  return false;
})

Group.find = jest.fn().mockResolvedValue([])
Group.findOne = jest.fn().mockResolvedValue(null)
User.findOne = jest.fn().mockResolvedValue(mockReq.body.memberEmails) 

await createGroup(mockReq, mockRes)

expect(mockRes.status).toHaveBeenCalledWith(400)
expect(mockRes.json).toHaveBeenCalledWith(
  {error: expect.any(String)})
})

test.only("Returns a 400 error if at least one of the member emails is an empty string", async() => {
  const mockReq = {
    body: {
        name: "group1",
        memberEmails: [" ", "santoro@polito.it"]
    },
    cookies: {accessToken: "bbbi", refreshToken: "bbjbjkb"},
    url: "/api/groups"
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

const value = {
  email: 'admin@polito.it',
  username: 'santosanto',
  role: 'Admin'}

jwt.verify.mockReturnValue(value)

isValidEmail.mockImplementation(() => {
  return false;
})

Group.find = jest.fn().mockResolvedValue([])
Group.findOne = jest.fn().mockResolvedValue(null)
User.findOne = jest.fn().mockResolvedValue(mockReq.body.memberEmails) 

await createGroup(mockReq, mockRes)

expect(mockRes.status).toHaveBeenCalledWith(400)
expect(mockRes.json).toHaveBeenCalledWith(
  {error: expect.any(String)})
})

test.only("Returns a 401 error if called by a user who is not authenticated (authType = Simple)", async() => {
  const mockReq = {
    body: {
        name: "group1",
        memberEmails: ["francesco@polito.it", "santoro@polito.it"]
    },
    cookies: {accessToken: "bbbi", refreshToken: "bbjbjkb"},
    url: "/api/groups"
}

const mockRes = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    locals: {
        refreshTokenMessage: ""
    }
}

verifyAuth.mockImplementation(() => {
    return {authorized: false, cause: "Unauthorized"}
})

await createGroup(mockReq, mockRes)

expect(mockRes.status).toHaveBeenCalledWith(401)
expect(mockRes.json).toHaveBeenCalledWith(
  {error: expect.any(String)})
})

})

describe("getGroups", () => {
  
  test.only("should return empty list if there are no groups", async () => {
    const mockReq = {
      body: {},
      cookies: {accessToken: "validAccessToken", refreshToken: "validRefreshToken"},
      url: "/api/groups"
    }

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: ""
      }
    }

    verifyAuth.mockImplementation(() => ({authorized: true, cause: "Authorized"}))

    const groups = []; 

    Group.find = jest.fn().mockResolvedValue(groups)
    await getGroups(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith({data: [], refreshedTokenMessage: ""})
    })

  test.only("should retrieve list of all groups", async () => {
    const mockReq = {
      body: {},
      cookies: {accessToken: "validAccessToken", refreshToken: "validRefreshToken"},
      url: "/api/groups"
    }

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: ""
      }
    }

    verifyAuth.mockImplementation(() => ({authorized: true, cause: "Authorized"}))

    const groups = [
      {name: "Family", members: [{email: "mario.red@email.com"}, {email: "luigi.red@email.com"}]}, 
      {name: "Friends", members: [{email: "francesco.green@email.com"}, {email: "marco.blue@email.com"}]}
    ]; 

    Group.find = jest.fn().mockResolvedValue(groups)
    await getGroups(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith({
      data: groups, refreshedTokenMessage: ""})
  })
  
  test.only("Returns a 401 error if called by an authenticated user who is not an admin", async () => {
    const mockReq = {
      body: {},
      cookies: {accessToken: "validAccessToken", refreshToken: "validRefreshToken"},
      url: "/api/groups"
    }

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: ""
      }
    }

    verifyAuth.mockImplementation(() => ({authorized: false, cause: "Unauthorized"}))

    await getGroups(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(401)
    expect(mockRes.json).toHaveBeenCalledWith({error: expect.any(String)})
  })

 })

describe("getGroup", () => {
  test.only("should retrieve list of the specified group", async () => {
    const mockReq = {
      body: {},
      params: {name: "group20"},
      cookies: {accessToken: "validAccessToken", refreshToken: "validRefreshToken"},
      url: "/api/groups/:name"
    }

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: ""
      }
    }

    verifyAuth.mockImplementation(() => ({authorized: true, cause: "Authorized"}))

    const groups = [{name: "Family", members: [{email: "mario.red@email.com"},
    {email: "luigi.red@email.com"}]}]; 

    Group.findOne = jest.fn().mockResolvedValue(groups)
    await getGroup(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith({data: groups, refreshedTokenMessage: ""})
    })

    test.only("Returns a 400 error if the group name passed as a route parameter does not represent a group in the database", async () => {
      const mockReq = {
        body: {},
        params: {name: "group20"},
        cookies: {accessToken: "validAccessToken", refreshToken: "validRefreshToken"},
        url: "/api/groups/:name"
      }
  
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
          refreshedTokenMessage: ""
        }
      }
  
      verifyAuth.mockImplementation(() => ({authorized: true, cause: "Authorized"}))
  
      Group.findOne = jest.fn().mockResolvedValue(null)
      await getGroup(mockReq, mockRes);
  
      expect(mockRes.status).toHaveBeenCalledWith(400)
      })

      test.only("Returns a 401 error if called by an authenticated user who is neither part of the group (authType = Group) nor an admin (authType = Admin)", async () => {
        const mockReq = {
          body: {},
          params: {name: "group20"},
          cookies: {accessToken: "invalidAccessToken", refreshToken: "invalidRefreshToken"},
          url: "/api/groups/:name"
        }
    
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          locals: {
            refreshedTokenMessage: ""
          }
        }
    
        verifyAuth.mockImplementation(() => ({authorized: false, cause: "Unauthorized"}))

        const groups = [{name: "Family", members: [{email: "mario.red@email.com"},
                        {email: "luigi.red@email.com"}]}];
    
        Group.findOne = jest.fn().mockResolvedValue(groups)
        await getGroup(mockReq, mockRes);
    
        expect(mockRes.status).toHaveBeenCalledWith(401)
        })

 })

describe("addToGroup", () => {
  test.only("It must add the requested members to the specified group", async () => {
    const mockReq = {
      body: {emails: ["pietroblue@email.com", "antoniomarco@email.com"]},
      params: {name: "group451"},
      cookies: {accessToken: "validAccessToken", refreshToken: "validRefreshToken"},
      url: "/api/groups/:name/insert"
    }

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: ""
      }
    }

    const group1 = {name: 'group451',
    members: [
      {
        email: 'franciosissimo@polito.it'
      },
      {
        email: 'admin@polito.it'
      }
    ]}
    
    verifyAuth.mockImplementation(() => ({authorized: true, cause: "Authorized"}))
    //the first user exists and it is not already in another group
    User.findOne = jest.fn().mockResolvedValue(null)
    User.findOne = jest.fn().mockResolvedValueOnce({email: 'franciosissimo@polito.it'})
    isValidEmail.mockImplementation(() => {
      return true;
    })
    Group.findOne = jest.fn().mockResolvedValue(null)
    Group.findOne = jest.fn().mockResolvedValueOnce(group1)

    const data = {group: {name: "group451", members: [{email: "franciosissimo@polito.it"}, 
    {email: "admin@polito.it"}, {email: "pietroblue@email.com"}]}, membersNotFound: ["antoniomarco@email.com"], alreadyInGroup: []}
    //jest.spyOn(Group.prototype, "save").mockResolvedValue(data)
    
    Group.prototype.save.mockImplementation(() => {return data});
    
    await addToGroup(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith({data, refreshedTokenMessage: ""})
    })

  test.only("Returns a 400 error if the group name passed as a route parameter does not represent a group in the database", async () => {
    const mockReq = {
      body: {emails: ["pietroblue@email.com", "antoniomarco@email.com"]},
      params: {name: "group451"},
      cookies: {accessToken: "validAccessToken", refreshToken: "validRefreshToken"},
      url: "/api/groups/:name/insert"
    }

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: ""
      }
    }

    verifyAuth.mockImplementation(() => ({authorized: true, cause: "Authorized"}))
    
    Group.findOne = jest.fn().mockResolvedValue(null)
    
    await addToGroup(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(mockRes.json).toHaveBeenCalledWith({error: expect.any(String)})
    })

  test.only("Returns a 400 error if all the provided emails represent users that are already in a group or do not exist in the database", async () => {
    const mockReq = {
      body: {emails: ["pietroblue@email.com", "antoniomarco@email.com"]},
      params: {name: "group451"},
      cookies: {accessToken: "validAccessToken", refreshToken: "validRefreshToken"},
      url: "/api/groups/:name/insert"
    }

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: ""
      }
    }

    const group1 = {name: 'group451',
    members: [
      {
        email: 'franciosissimo@polito.it'
      },
      {
        email: 'admin@polito.it'
      }
    ]}
    
    verifyAuth.mockImplementation(() => ({authorized: true, cause: "Authorized"}))
    //the first user exists and it is not already in another group
    User.findOne = jest.fn().mockResolvedValue(null)
    isValidEmail.mockImplementation(() => {
      return true;
    })
    Group.findOne = jest.fn().mockResolvedValue(true)
    Group.findOne = jest.fn().mockResolvedValueOnce(group1)
    
    await addToGroup(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(mockRes.json).toHaveBeenCalledWith({error: expect.any(String)})
    })
  
  test.only("Returns a 400 error if at least one of the member emails is not in a valid email format", async () => {
    const mockReq = {
      body: {emails: ["pietroblueemail.com", "antoniomarco@email.com"]},
      params: {name: "group451"},
      cookies: {accessToken: "validAccessToken", refreshToken: "validRefreshToken"},
      url: "/api/groups/:name/insert"
    }

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: ""
      }
    }

    const group = {name: 'group451',
    members: [
      {
        email: 'franciosissimo@polito.it'
      },
      {
        email: 'admin@polito.it'
      }
    ]}

    verifyAuth.mockImplementation(() => ({authorized: true, cause: "Authorized"}))
    
    Group.findOne = jest.fn().mockResolvedValue(group)

    isValidEmail.mockImplementation(() => {
      return false;
    })
    
    await addToGroup(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(mockRes.json).toHaveBeenCalledWith({error: expect.any(String)})
    })

  test.only("Returns a 401 error if called by an authenticated user who is not part of the group (authType = Group) if the route is `api/groups/:name/add`", async () => {
    const mockReq = {
      body: {emails: ["pietroblue@email.com", "antoniomarco@email.com"]},
      params: {name: "group451"},
      cookies: {accessToken: "validAccessToken", refreshToken: "validRefreshToken"},
      url: "/api/groups/:name/add"
    }

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
        refreshedTokenMessage: ""
      }
    }

    const group = {name: 'group451',
    members: [
      {
        email: 'franciosissimo@polito.it'
      },
      {
        email: 'admin@polito.it'
      }
    ]}

    verifyAuth.mockImplementation(() => ({authorized: false, cause: "Unauthorized"}))
    
    Group.findOne = jest.fn().mockResolvedValue(group)
    
    await addToGroup(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(401)
    expect(mockRes.json).toHaveBeenCalledWith({error: expect.any(String)})
    })
 })

 describe("removeFromGroup", () => {
  test("Should remove members from group as admin", async () => {
    const req = {
      params: {
        name: "group1",
      },
      body: {
        emails: ["admin@yahoo.com", "admin2@yahoo.com"],
      },
      cookies: {accessToken: "bbbi", refreshToken: "bbjbjkb"}, 
      url: "/api/groups/group1/pull",
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  
    verifyAuth.mockImplementation(() => {
      return {authorized: true, cause: "Authorized"}
  })
  Group.findOne.mockResolvedValueOnce({ name: "group1", members: [] })
  User.findOne .mockResolvedValueOnce({ email: "admin@yahoo.com" })
    User.findOne.mockResolvedValueOnce({ emails: "admin2@yahoo.com"})
  Group.updateOne.mockResolvedValueOnce({});
  Group.findOne.mockResolvedValueOnce({ name: "group1", members: [] });
  await removeFromGroup(req, res);
  expect(Group.findOne).toHaveBeenCalledWith({ name: "group1" });
  expect(User.findOne).toHaveBeenCalledWith({ email: "admin@yahoo.com" });
  expect(User.findOne).toHaveBeenCalledWith({ email: "admin2@yahoo.com" });
  expect(Group.updateOne).toHaveBeenCalledWith(
    { name: "group1" },
    { $pull: { members: { email: "admin@yahoo.com" } } }
  );
  expect(Group.updateOne).toHaveBeenCalledWith(
    { name: "group1" },
    { $pull: { members: { email: "admin2@yahoo.com" } } }
  );
  expect(res.json).toHaveBeenCalledWith({
    data: {
      group: {
        name: "group1",
        members: [],
      },
      membersNotFound: [],
      notInGroup: [],
    },
    refreshedTokenMessage: undefined,
  });
  expect(res.status).toHaveBeenCalledWith(200);
});

test("Should return 401 unauthorized if not an admin or group member", async () => {
  const req = {
    params: {
      name: "group1",
    },
    cookies: {accessToken: "aaaaa", refreshToken: "bbbbb"},
    url: "/api/groups/group1/pull",
    body: {
      emails: ["user1@example.com", "user2@example.com"],
    },
  }
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  }
  verifyAuth.mockReturnValueOnce({ authorized: false, cause: "Unauthorized" })
  await removeFromGroup(req, res)
  expect(res.status).toHaveBeenCalledWith(401);
  expect(res.json).toHaveBeenCalledWith({error: expect.any(String)});
});
test("Should return 400 error if the request body does not contain all the necessary attributes", async()=>{
  const req = {
    params: {
      name: "group1",
    },
    body: {
      email: ""
    },
    cookies: {accessToken: "aaaaa", refreshToken: "bbbbb"},
    url: "/api/groups/group1/pull",
  }
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  }
  verifyAuth.mockReturnValueOnce({ authorized: true, cause: "Authorized" })
  await removeFromGroup(req,res)
  expect(res.status).toHaveBeenCalledWith(400)
  expect(res.json).toHaveBeenCalledWith( {error: expect.any(String)})
})
test ("400 error if the group name passed as a route parameter does not represent a group in the database " , async()=> {
  const req =  {
    params: {
      name: "group1"
    },
    body : {
      emails : ["neda@yahoo.com"]
    }
  }
const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    locals: {
        refreshTokenMessage: ""
    }
}
Group.findOne.mockResolvedValueOnce(null)
await removeFromGroup(req,res)
expect(res.status).toHaveBeenCalledWith(400)
expect(res.json).toHaveBeenCalledWith({error: expect.any(String)})
})

test('Should return 400 error if at least one of the emails is an empty string' , async()=>{
  const req = {
    body: {
      emails : [" " ,"saadat@yahoo.com"]
    },
    cookies: {accessToken: "aaaaa", refreshToken: "bbbbb"},
    url: "/api/groups/group1/pull",
  }
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    locals: {
        refreshTokenMessage: ""
    }

  }
  const MockparamsGroup = {
    name : "group1"
  }
  Group.findOne.mockResolvedValue(MockparamsGroup)
  verifyAuth.mockImplementation(() => {
    return {authorized: true, cause: "Authorized"}
})

await removeFromGroup(req,res)
expect(res.status).toHaveBeenCalled(400)
expect(res.json).toHaveBeenCalledWith({error: expect.any(String)});
})
})

describe("deleteUser", () => { })

describe("deleteGroup",() => { 
  test ("Group has been successfuly deleted", async()=> {
    const req = {
      body :{ 
        name :"Family" 
      },
      cookies: {accessToken: "aaaaa", refreshToken: "bbbbb"}
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
  await deleteGroup(req,res)
  Group.findOne.mockResolvedValue({name: "Family"})
  expect(Group.deleteOne).mockResolvedValue({name: "family"})
  expect(res.status).toHaveBeenCalledWith(200)
  expect(res.json).toHaveBeenCalled({data: {error : expect.any(String) } })
  })

  test("Should Return 400, if User is not Authorized", async()=> {
    const req = {
      body :{ 
        name :"Family" 
      },
      cookies: {accessToken: "aaaaa", refreshToken: "bbbbb"}
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      locals: {
          refreshTokenMessage: ""
      }
    }
    verifyAuth.mockImplementation(() => {
      return {authorized: false, cause: "Unauthorized"}
  })
    await deleteGroup(req,res)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(mockRes.json).toHaveBeenCalledWith(
      {error: expect.any(String)})
  })
  test("Should return 400 if the request body does not contain all the necessary attributes" , async()=>{
   const req = {
   body :{  
    },
    cookies: {accessToken: "aaaaa", refreshToken: "bbbbb"}
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

await deleteGroup(req,res)
expect(res.status).toHaveBeenCalledWith(400)
expect(mockRes.json).toHaveBeenCalledWith(
    {error: expect.any(String)})
  })
  test("Should Returns a 400 error if the name passed in the request body is an empty string" , async()=>{
    const req = {
      body :{
        name : " "
      },
      cookies: {accessToken: "aaaaa", refreshToken: "bbbbb"}
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
  
  await deleteGroup(req,res)
  expect(res.status).toHaveBeenCalledWith(400)
  expect(mockRes.json).toHaveBeenCalledWith( {error: expect.any(String)})
    })
    test ("Should Return  400 error if group is not exist ", async()=>{
      const Mocreq = {
        body :{
          name : "student"
        },
        cookies: {accessToken: "aaaaa", refreshToken: "bbbbb"}
      }
      const Mockres = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        locals: {
            refreshTokenMessage: ""
        }
      }
      verifyAuth.mockImplementation(() => {
        return {authorized: true, cause: "Authorized"}
    })
    await deleteGroup(Mocreq,Mockres)
      Group.findOne.mockResolvedValue(0)
      expect(Mockres.status).toHaveBeenCalledWith(400)
      expect(Mockres.json).toHaveBeenCalledWith(
      {error: expect.any(String)})
    })
})