import request from 'supertest';
import { app } from '../app';
import { User } from '../models/User.js';
import { Group } from '../models/User.js';
import { getGroups } from '../controllers/users';
import { verifyAuth } from '../controllers/utils';
import jwt from "jsonwebtoken";

/**
 * In order to correctly mock the calls to external modules it is necessary to mock them using the following line.
 * Without this operation, it is not possible to replace the actual implementation of the external functions with the one
 * needed for the test cases.
 * `jest.mock()` must be called for every external module that is called in the functions under test.
 */
jest.mock("../models/User.js")
/*
const userOne = {email: "user@test.com", username: "frasan", role: "Admin"}

const accessToken = ""
const refreshToken = ""
userOne.refreshToken = jwt.sign({
  email: userOne.email,
  id: userOneId.toString(),
  username: userOne.username,
  role: userOne.role
}, process.env.ACCESS_KEY, { expiresIn: '7d' });
*/

/**
 * Defines code to be executed before each test case is launched
 * In this case the mock implementation of `User.find()` is cleared, allowing the definition of a new mock implementation.
 * Not doing this `mockClear()` means that test cases may use a mock implementation intended for other test cases.
 */
beforeEach(() => {
  User.find.mockClear()
  Group.find.mockClear()
  //additional `mockClear()` must be placed here
});

describe("getUsers", () => {
  test("should return empty list if there are no users", async () => {
    //any time the `User.find()` method is called jest will replace its actual implementation with the one defined below
    jest.spyOn(User, "find").mockImplementation(() => [])
    const response = await request(app)
      .get("/api/users")

    expect(response.status).toBe(200)
    expect(response.body).toEqual([])
  })

  test("should retrieve list of all users", async () => {
    const retrievedUsers = [{ username: 'test1', email: 'test1@example.com', password: 'hashedPassword1' }, { username: 'test2', email: 'test2@example.com', password: 'hashedPassword2' }]
    jest.spyOn(User, "find").mockImplementation(() => retrievedUsers)
    const response = await request(app)
      .get("/api/users")

    expect(response.status).toBe(200)
    expect(response.body).toEqual(retrievedUsers)
  })
})

describe("getUser", () => { })

describe("createGroup", () => { })

describe("getGroups", () => {
  /*
  test("should return empty list if there are no groups", async () => {
    const mockReq = {
      cookies: "accessToken=accessToken; refreshToken=refreshToken"
    }

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    jest.spyOn(Group, "find").mockResolvedValue(() => [])
    await getGroups(mockReq, mockRes)
    expect(Group.find).toHaveBeenCalled()
    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith([])
  });

  test("should return list of groups for admin", async () => {
    const groups = [
      {name: "Family", members: [{email: "mario.red@email.com"}, {email: "luigi.red@email.com"}]}, 
      {name: "Friends", members: [{email: "francesco.green@email.com"}, {email: "marco.blue@email.com"}]}
    ];

    verifyAuth.mockImplementation(() => ({authorized: true, cause: "Authorized"}))
    Group.find.mockImplementation(() => groups)

    const response = await request(app).get("/api/groups");

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      data: groups.map(group => ({name: group.name, members: group.members}))
    })
  })

  test("should retrieve list of all groups", async () => {
    const retrievedGroup = [{name: "Family", members: [{email: "mario.red@email.com"}, {email: "luigi.red@email.com"}]}, 
                            {name: "Friends", members: [{email: "francesco.green@email.com"}, {email: "marco.blue@email.com"}]}]
    jest.spyOn(Group, "find").mockImplementation(() => retrievedGroup)
    const response = await request(app).get("/api/groups")

    expect(response.status).toBe(200)
    expect(response.body).toEqual(retrievedGroup)
 
  })
  */
 })

describe("getGroup", () => { })

describe("addToGroup", () => { })

describe("removeFromGroup", () => { })

describe("deleteUser", () => { })

describe("deleteGroup", () => { })