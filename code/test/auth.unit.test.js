import request from 'supertest';
import { app } from '../app';
import { User } from '../models/User.js';
import jwt from 'jsonwebtoken';
const bcrypt = require("bcryptjs")

jest.mock("bcryptjs")
jest.mock('../models/User.js');

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
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
    });
});

describe('logout', () => { 
    test('Dummy test, change it', () => {
        expect(true).toBe(true);
    });
});
