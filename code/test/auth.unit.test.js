import request from 'supertest';
import { app } from '../app';
import { User } from '../models/User.js';
import { login } from '../controllers/auth';
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

describe('register', () => { 
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
    });
});

describe("registerAdmin", () => { 
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
    });
})

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

describe('logout', () => { 
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
    });
});
