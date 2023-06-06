import request from 'supertest';
import { app } from '../app';
import { User } from '../models/User.js';
import { login, register, registerAdmin } from '../controllers/auth';
import jwt from "jsonwebtoken";
const bcrypt = require("bcryptjs")

beforeEach(() => {
    User.find.mockClear();
    User.findOne.mockClear();
    User.prototype.save.mockClear();
    User.aggregate.mockClear();

    jest.clearAllMocks();
})

jest.mock("bcryptjs")
jest.mock('../models/User.js');
jest.mock("jsonwebtoken")

describe("register", () => {
  test.only("Should return 400 if request body does not contain all the necessary attributes", async () => {
    const mockReq = {
      body: { username: "Mario", password: "securePass" },
      url: "/api/register",
      cookies: "",
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
    };
    await register(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: "Missing attributes" });
  });

  test.only("Should return 400 if at least one of the parameters in the request body is an empty string", async () => {
    const mockReq = {
      body: { username: "Mario", email: "", password: "securePass" },
      url: "/api/register",
      cookies: "",
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
    };
    await register(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: "Empty attributes" });
  });

  test.only("Should return 400 if the email in the request body is not in a valid email format", async () => {
    const mockReq = {
      body: { username: "Mario", email: "notAnEmail", password: "securePass" },
      url: "/api/register",
      cookies: "",
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
    };
    await register(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: "Email is not valid",
    });
  });

  test.only("Should return 400 if the username in the request body identifies an already existing user", async () => {
    const mockReq = {
      body: {
        username: "test",
        email: "test@test.com",
        password: "securePass",
      },
      url: "/api/register",
      cookies: "",
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
    };
    User.findOne.mockImplementationOnce(() => {
        return null;
    });
    User.findOne.mockImplementationOnce(() => {
      return {
        username: "test",
        email: "test@test.com",
      };
    });
    await register(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: "Username is already registered",
    });
  });

  test.only("Should return 400 if the email in the request body identifies an already existing user", async () => {
    const mockReq = {
        body: {
          username: "test",
          email: "test@test.com",
          password: "securePass",
        },
        url: "/api/register",
        cookies: "",
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        cookie: jest.fn(),
      };
      User.findOne.mockImplementationOnce(() => {
        return {
          username: "test",
          email: "test@test.com",
        };
      });
      User.findOne.mockImplementationOnce(() => {
        return null;
      });
      await register(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Email is already registered",
      });
  });

  test.only("Should return 200 if the user is added successfully", async () => {
    const mockReq = {
        body: {
          username: "test",
          email: "test@test.com",
          password: "securePass",
        },
        url: "/api/register",
        cookies: "",
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        cookie: jest.fn(),
      };
      User.findOne.mockResolvedValue(null);
      User.create.mockImplementation(() => {
        return {
          username: "test",
          email: "test@test.com",
        };
      });
      await register(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        data: "user added succesfully",
      });
  });
});

/**
 * 
- Request Parameters: None
- Request Body Content: An object having attributes `username`, `email` and `password`
  - Example: `{username: "admin", email: "admin@email.com", password: "securePass"}`
- Response `data` Content: A message confirming successful insertion
  - Example: `res.status(200).json({data: {message: "User added successfully"}})`
- Returns a 400 error if the request body does not contain all the necessary attributes
- Returns a 400 error if at least one of the parameters in the request body is an empty string
- Returns a 400 error if the email in the request body is not in a valid email format
- Returns a 400 error if the username in the request body identifies an already existing user
- Returns a 400 error if the email in the request body identifies an already existing user
 */
describe("registerAdmin", () => {
  test.only("Should return 400 if request body does not contain all the necessary attributes", async () => {
    const mockReq = {
      body: { username: "Mario", password: "securePass" },
      url: "/api/admin",
      cookies: "",
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
    };
    await registerAdmin(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: "Missing attributes" });
  });

  test.only("Should return 400 if at least one of the parameters in the request body is an empty string", async () => {
    const mockReq = {
      body: { username: "Mario", email: "", password: "securePass" },
      url: "/api/admin",
      cookies: "",
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
    };
    await registerAdmin(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: "Empty attributes" });
  });

  test.only("Should return 400 if the email in the request body is not in a valid email format", async () => {
    const mockReq = {
      body: { username: "Mario", email: "notAnEmail", password: "securePass" },
      url: "/api/admin",
      cookies: "",
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
    };
    await registerAdmin(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: "Email is not valid",
    });
  });

  test.only("Should return 400 if the username in the request body identifies an already existing user", async () => {
    const mockReq = {
      body: {
        username: "test",
        email: "test@test.com",
        password: "securePass",
      },
      url: "/api/admin",
      cookies: "",
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
    };
    User.findOne.mockImplementationOnce(() => {
      return null;
    });
    User.findOne.mockImplementationOnce(() => {
      return {
        username: "test",
        email: "test@test.com",
      };
    });
    await registerAdmin(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: "Username is already registered",
    });
  });

  test.only("Should return 400 if the email in the request body identifies an already existing user", async () => {
    const mockReq = {
      body: {
        username: "test",
        email: "test@test.com",
        password: "securePass",
      },
      url: "/api/admin",
      cookies: "",
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
    };
    User.findOne.mockImplementationOnce(() => {
      return {
        username: "test",
        email: "test@test.com",
      };
    });
    User.findOne.mockImplementationOnce(() => {
      return null;
    });
    await registerAdmin(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: "Email is already registered",
    });
  });

  test.only("Should return 200 if the user is added successfully", async () => {
    const mockReq = {
      body: {
        username: "test",
        email: "test@test.com",
        password: "securePass",
      },
      url: "/api/admin",
      cookies: "",
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
    };
    User.findOne.mockResolvedValue(null);
    User.create.mockImplementation(() => {
      return {
        username: "test",
        email: "test@test.com",
      };
    });
    await registerAdmin(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      data: "admin added succesfully",
    });
  });
});

describe('login', () => { 
    test('login performed successfully', async () => {
        const mockReq = {
            body: {email: "antoniomarco@email.com", password: "password"},
            url: "/api/login",
            cookies: ""
        }
        
        const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        cookie: jest.fn(),
        locals: {
            refreshedTokenMessage: ""
        }
        }

        const user = {
            username: 'santosanto',
            email: 'admin@polito.it',
            password: '$2a$12$74Uc1Tpatb7H0OZTzEGyVeZy/dwYKhDZ3biqcFW0KNP/neeQ/AM6a',
            role: 'Admin',
            __v: 0,
            refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluQHBvbGl0by5pdCIsImlkIjoiNjQ3NGE2NjZlZDIzZTRkYzc5MzU5ZDQzIiwidXNlcm5hbWUiOiJzYW50b3NhbnRvIiwicm9sZSI6IkFkbWluIiwiaWF0IjoxNjg1OTcyNjkzLCJleHAiOjE2ODY1Nzc0OTN9.OS3iLLDoD-dx_L4H6aQxg4LKUp4gTPm-gY57JS_BOD8'
          }

        User.findOne = jest.fn().mockResolvedValue(user)
        bcrypt.compare = jest.fn().mockResolvedValue(true)
        jwt.sign.mockReturnValue("validRefreshToken")
        jwt.sign.mockReturnValueOnce("validAccessToken")

        const savedUser = {
            username: 'santosanto',
            email: 'admin@polito.it',
            password: '$2a$12$74Uc1Tpatb7H0OZTzEGyVeZy/dwYKhDZ3biqcFW0KNP/neeQ/AM6a',
            role: 'Admin',
            __v: 0,
            refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluQHBvbGl0by5pdCIsImlkIjoiNjQ3NGE2NjZlZDIzZTRkYzc5MzU5ZDQzIiwidXNlcm5hbWUiOiJzYW50b3NhbnRvIiwicm9sZSI6IkFkbWluIiwiaWF0IjoxNjg1OTg0NTAwLCJleHAiOjE2ODY1ODkzMDB9.VwbSaCy8-0P-QuurwUB-ZHgyKEv8eFoL8wFZoZPykh0'
          }

        User.prototype.save.mockImplementation(() => {return savedUser});

        await login(mockReq, mockRes)

        expect(mockRes.status).toHaveBeenCalledWith(200)
        expect(mockRes.cookie).toHaveBeenCalledWith("accessToken", expect.any(String), { httpOnly: true, domain: "localhost", path: "/api", maxAge: 60 * 60 * 1000, sameSite: "none", secure: true })
        expect(mockRes.cookie).toHaveBeenCalledWith('refreshToken', expect.any(String), { httpOnly: true, domain: "localhost", path: '/api', maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: 'none', secure: true })
        expect(mockRes.json).toHaveBeenCalledWith({ data: { accessToken: expect.any(String), refreshToken: expect.any(String) } })
    });

    test('Returns a 400 error if the supplied password does not match with the one in the database', async () => {
        const mockReq = {
            body: {email: "antoniomarco@email.com", password: "password"},
            url: "/api/login",
            cookies: ""
        }
        
        const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        cookie: jest.fn(),
        locals: {
            refreshedTokenMessage: ""
        }
        }

        const user = {
            username: 'santosanto',
            email: 'admin@polito.it',
            password: '$2a$12$74Uc1Tpatb7H0OZTzEGyVeZy/dwYKhDZ3biqcFW0KNP/neeQ/AM6a',
            role: 'Admin',
            __v: 0,
            refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluQHBvbGl0by5pdCIsImlkIjoiNjQ3NGE2NjZlZDIzZTRkYzc5MzU5ZDQzIiwidXNlcm5hbWUiOiJzYW50b3NhbnRvIiwicm9sZSI6IkFkbWluIiwiaWF0IjoxNjg1OTcyNjkzLCJleHAiOjE2ODY1Nzc0OTN9.OS3iLLDoD-dx_L4H6aQxg4LKUp4gTPm-gY57JS_BOD8'
          }

        User.findOne = jest.fn().mockResolvedValue(user)
        bcrypt.compare = jest.fn().mockResolvedValue(false)

        await login(mockReq, mockRes)

        expect(mockRes.status).toHaveBeenCalledWith(400)
        expect(mockRes.json).toHaveBeenCalledWith({error: expect.any(String)})
    });

    test('Returns a 400 error if the email in the request body does not identify a user in the database', async () => {
        const mockReq = {
            body: {email: "antoniomarco@email.com", password: "password"},
            url: "/api/login",
            cookies: ""
        }
        
        const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        cookie: jest.fn(),
        locals: {
            refreshedTokenMessage: ""
        }
        }

        User.findOne = jest.fn().mockResolvedValue(null)

        await login(mockReq, mockRes)

        expect(mockRes.status).toHaveBeenCalledWith(400)
        expect(mockRes.json).toHaveBeenCalledWith({error: expect.any(String)})
    });
});

describe("logout", () => {
	test('Should return 400 error if refreshToken cookie is not provided', async () => {
		const MocReq = {
		  cookies: {}
		};
		const MocRes = {
		  status: jest.fn().mockReturnThis(),
		  json: jest.fn()
		};
		await logout(MocReq, MocRes);
		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith('user not found');
	  });
	  test('Should return 400 error if user with the provided refreshToken is not found', async () => {
		const req = {
		  cookies: {
			refreshToken: 'invalidToken'
		  }
		};
		const res = {
		  status: jest.fn().mockReturnThis(),
		  json: jest.fn()
		};
		User.findOne.mockResolvedValue(null);
		await logout(req, res);
		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith('user not found');
	  });
	  test('Should return 400 error if user with the provided refreshToken is not found', async () => {
		const req = {
		  cookies: {
			refreshToken: 'invalidToken'
		  }
		};
	  
		const res = {
		  status: jest.fn().mockReturnThis(),
		  json: jest.fn()
		}; 
		User.findOne.mockResolvedValue(null);
		await logout(req, res);
		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith('user not found');
	  });
	  test('Should successfully log out the user', async () => {
		const req = {
		  cookies: {
			refreshToken: 'validToken'
		  }
		};
	  
		const res = {
		  status: jest.fn().mockReturnThis(),
		  json: jest.fn(),
		  cookie: jest.fn()
		};
	  
		const user = {
		  refreshToken: 'validToken',
		  save: jest.fn().mockResolvedValue({ refreshToken: null })
		};
	  
		User.findOne.mockResolvedValue(user);
	  
		await logout(req, res);
	  
		expect(user.refreshToken).toBeNull();
		expect(res.cookie).toHaveBeenCalledWith('accessToken', '', {
		  httpOnly: true,
		  path: '/api',
		  maxAge: 0,
		  sameSite: 'none',
		  secure: true
		});
		expect(res.cookie).toHaveBeenCalledWith('refreshToken', '', {
		  httpOnly: true,
		  path: '/api',
		  maxAge: 0,
		  sameSite: 'none',
		  secure: true
		});
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.json).toHaveBeenCalledWith('logged out');
	  });
	  test('Should return 400 error if an error occurs during logout', async () => {
		const req = {
		  cookies: {
			refreshToken: 'validToken'
		  }
		};
	  
		const res = {
		  status: jest.fn().mockReturnThis(),
		  json: jest.fn(),
		  cookie: jest.fn()
		};
	  
		const user = {
		  refreshToken: 'validToken',
		  save: jest.fn().mockRejectedValue('Some error')
		};	  
		User.findOne.mockResolvedValue(user); 
		await logout(req, res);
		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith('Some error');
	  });	  
});
