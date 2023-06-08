import {
    handleDateFilterParams,
    verifyAuth,
    handleAmountFilterParams,
  } from "../controllers/utils";
  
  jest.mock("jsonwebtoken");
  
  beforeAll(() => {
    jest.clearAllMocks();
  });
  
  describe("handleDateFilterParams", () => {
    test.only(`Returns a filter object which contains data attribute if only "date" is present in query`, () => {
      const req = { query: { date: "2023-04-21" } };
      const res = handleDateFilterParams(req);
      //The response object should be: {date: {$gte: 2023-04-21T00:00:00.000Z, $lte: 2023-04-21T23:59:59.999Z}}
      //Checks on the outer property name, as well as on the two inner ones, must be done
      expect(res).toHaveProperty("date");
      expect(res.date).toHaveProperty("$gte");
      expect(res.date).toHaveProperty("$lte");
      //At least day and hour must be as expected for both starting and ending day
      //In this case the date is the same since the parameter is "date"
      expect(res.date.$gte.toISOString().slice(0, 19)).toEqual(
        req.query.date.slice(0, 10) + "T00:00:00"
      );
      expect(res.date.$lte.toISOString().slice(0, 19)).toEqual(
        req.query.date.slice(0, 10) + "T23:59:59"
      );
    });
  
    test.only(`Throws an error if at least one of the query parameters is not a date in the format "YYYY-MM-DD"`, () => {
      //The date is in the correct format but is not an actual date (there are only twelve months)
      const req1 = { query: { date: "2023-13-21" } };
      //The date is valid but is not in the correct formant
      const req2 = { query: { upTo: "21-03-2023" } };
      expect(() => handleDateFilterParams(req1)).toThrow();
      expect(() => handleDateFilterParams(req2)).toThrow();
    });
  
    test.only(`Throws an error if in the query "date" parameter is present with either "from" or "upTo"`, () => {
      const req1 = { query: { date: "2023-07-21", upTo: "2023-09-29" } };
      const req2 = { query: { date: "2023-07-21", from: "2023-09-29" } };
      const req3 = {
        query: { date: "2023-07-21", from: "2023-09-29", upTo: "2023-10-31" },
      };
      expect(() => handleDateFilterParams(req1)).toThrow();
      expect(() => handleDateFilterParams(req2)).toThrow();
      expect(() => handleDateFilterParams(req3)).toThrow();
    });
  });
  
  describe("verifyAuth", () => {
    test("should return unauthorized if one token is missing", () => {
      const mockReq = {
        cookies: { accessToken: "testerAccessTokenValid" },
      };
      const mockRes = {};
  
      const response = verifyAuth(mockReq, mockRes, { authType: "User", username: "tester" });
      expect(response).toEqual({ authorized: false, cause: "Unauthorized" });
    });
  
    test("should return unauthorized if one token is missing information", () => {
      const mockReq = {
        cookies: { accessToken: "testerAccessTokenValid", refreshToken: "testerRefreshTokenValid" },
      };
      const mockRes = {};
      const decodedAccessToken = {
        email: "tester@test.com",
        role: "Regular",
      };
  
      jwt.verify.mockReturnValueOnce(decodedAccessToken);
  
      const response = verifyAuth(mockReq, mockRes, { authType: "User", username: "tester" });
      expect(response).toEqual({ authorized: false, cause: "Token is missing information" });
    });
  
    test("should return unauthorized if one token is missing information", () => {
      const mockReq = {
        cookies: { accessToken: "testerAccessTokenValid", refreshToken: "testerRefreshTokenValid" },
      };
      const mockRes = {};
      const decodedAccessToken = {
        email: "tester@test.com",
        username: "tester",
        role: "Regular",
      };
      const decodedRefreshToken = {
        email: "tester@test.com",
        role: "Regular",
      };
  
      jwt.verify.mockReturnValueOnce(decodedAccessToken);
      jwt.verify.mockReturnValueOnce(decodedRefreshToken);
  
      const response = verifyAuth(mockReq, mockRes, { authType: "User", username: "tester" });
      expect(response).toEqual({ authorized: false, cause: "Token is missing information" });
    });
  
    test("should return unauthorized if one token are from different user", () => {
      const mockReq = {
        cookies: { accessToken: "testerAccessTokenValid", refreshToken: "testerRefreshTokenValid" },
      };
      const mockRes = {};
      const decodedAccessToken = {
        email: "tester@test.com",
        username: "tester",
        role: "Regular",
      };
      const decodedRefreshToken = {
        email: "tester@test.com",
        username: "tester2",
        role: "Regular",
      };
  
      jwt.verify.mockReturnValueOnce(decodedAccessToken);
      jwt.verify.mockReturnValueOnce(decodedRefreshToken);
  
      const response = verifyAuth(mockReq, mockRes, { authType: "User", username: "tester" });
      expect(response).toEqual({ authorized: false, cause: "Mismatched users" });
    });
  
    test("should return simple authorization", () => {
      const mockReq = {
        cookies: { accessToken: "testerAccessTokenValid", refreshToken: "testerRefreshTokenValid" },
      };
      const mockRes = {};
      const decodedAccessToken = {
        email: "tester@test.com",
        username: "tester",
        role: "Regular",
      };
      const decodedRefreshToken = {
        email: "tester@test.com",
        username: "tester",
        role: "Regular",
      };
  
      jwt.verify.mockReturnValueOnce(decodedAccessToken);
      jwt.verify.mockReturnValueOnce(decodedRefreshToken);
  
      const response = verifyAuth(mockReq, mockRes, { authType: "Simple" });
      expect(response).toEqual({ authorized: true, cause: "Authorized" });
    });
  
    test("should return user authorization", () => {
      const mockReq = {
        cookies: { accessToken: "testerAccessTokenValid", refreshToken: "testerRefreshTokenValid" },
      };
      const mockRes = {};
      const decodedAccessToken = {
        email: "tester@test.com",
        username: "tester",
        role: "Regular",
      };
      const decodedRefreshToken = {
        email: "tester@test.com",
        username: "tester",
        role: "Regular",
      };
  
      jwt.verify.mockReturnValueOnce(decodedAccessToken);
      jwt.verify.mockReturnValueOnce(decodedRefreshToken);
  
      const response = verifyAuth(mockReq, mockRes, { authType: "User", username: "tester" });
      expect(response).toEqual({ authorized: true, cause: "Authorized" });
    });
  
    test("should return user authorization with expired date", () => {
      const mockReq = {
        cookies: { accessToken: "testerAccessTokenValid", refreshToken: "testerRefreshTokenValid" },
      };
      const mockRes = {};
      const decodedAccessToken = {
        email: "tester@test.com",
        username: "tester",
        role: "Regular",
        exp: 0,
      };
      const decodedRefreshToken = {
        email: "tester@test.com",
        username: "tester",
        role: "Regular",
      };
  
      jwt.verify.mockReturnValueOnce(decodedAccessToken);
      jwt.verify.mockReturnValueOnce(decodedRefreshToken);
  
      const response = verifyAuth(mockReq, mockRes, { authType: "User", username: "tester" });
      expect(response).toEqual({ authorized: true, cause: "Authorized" });
    });
  
    test("should return invalid user", () => {
      const mockReq = {
        cookies: { accessToken: "testerAccessTokenValid", refreshToken: "testerRefreshTokenValid" },
      };
      const mockRes = {};
      const decodedAccessToken = {
        email: "tester@test.com",
        username: "tester",
        role: "Regular",
      };
      const decodedRefreshToken = {
        email: "tester@test.com",
        username: "tester",
        role: "Regular",
      };
  
      jwt.verify.mockReturnValueOnce(decodedAccessToken);
      jwt.verify.mockReturnValueOnce(decodedRefreshToken);
  
      const response = verifyAuth(mockReq, mockRes, { authType: "User", username: "tester2" });
      expect(response).toEqual({ authorized: false, cause: "username does not match the related user's token" });
    });
  
    test("should return admin authorization", () => {
      const mockReq = {
        cookies: { accessToken: "testerAccessTokenValid", refreshToken: "testerRefreshTokenValid" },
      };
      const mockRes = {};
      const decodedAccessToken = {
        email: "tester@test.com",
        username: "tester",
        role: "Admin",
      };
      const decodedRefreshToken = {
        email: "tester@test.com",
        username: "tester",
        role: "Admin",
      };
  
      jwt.verify.mockReturnValueOnce(decodedAccessToken);
      jwt.verify.mockReturnValueOnce(decodedRefreshToken);
  
      const response = verifyAuth(mockReq, mockRes, { authType: "Admin", username: "tester" });
      expect(response).toEqual({ authorized: true, cause: "Authorized" });
    });
  
    test("should return admin authorization with expired date", () => {
      const mockReq = {
        cookies: { accessToken: "testerAccessTokenValid", refreshToken: "testerRefreshTokenValid" },
      };
      const mockRes = {};
      const decodedAccessToken = {
        email: "tester@test.com",
        username: "tester",
        role: "Admin",
        exp: 0,
      };
      const decodedRefreshToken = {
        email: "tester@test.com",
        username: "tester",
        role: "Admin",
      };
  
      jwt.verify.mockReturnValueOnce(decodedAccessToken);
      jwt.verify.mockReturnValueOnce(decodedRefreshToken);
  
      const response = verifyAuth(mockReq, mockRes, { authType: "Admin", username: "tester" });
      expect(response).toEqual({ authorized: true, cause: "Authorized" });
    });
  
    test("should return invalid admin", () => {
      const mockReq = {
        cookies: { accessToken: "testerAccessTokenValid", refreshToken: "testerRefreshTokenValid" },
      };
      const mockRes = {};
      const decodedAccessToken = {
        email: "tester@test.com",
        username: "tester",
        role: "Regular",
      };
      const decodedRefreshToken = {
        email: "tester@test.com",
        username: "tester",
        role: "Regular",
      };
  
      jwt.verify.mockReturnValueOnce(decodedAccessToken);
      jwt.verify.mockReturnValueOnce(decodedRefreshToken);
  
      const response = verifyAuth(mockReq, mockRes, { authType: "Admin", username: "tester2" });
      expect(response).toEqual({ authorized: false, cause: "function reserved for admins only" });
    });
  
    test("should return group authorization", () => {
      const mockReq = {
        cookies: { accessToken: "testerAccessTokenValid", refreshToken: "testerRefreshTokenValid" },
      };
      const mockRes = {};
      const decodedAccessToken = {
        email: "tester@test.com",
        username: "tester",
        role: "Regular",
      };
      const decodedRefreshToken = {
        email: "tester@test.com",
        username: "tester",
        role: "Regular",
      };
  
      jwt.verify.mockReturnValueOnce(decodedAccessToken);
      jwt.verify.mockReturnValueOnce(decodedRefreshToken);
  
      const response = verifyAuth(mockReq, mockRes, {
        authType: "Group",
        username: "tester",
        emails: ["tester@test.com"],
      });
      expect(response).toEqual({ authorized: true, cause: "Authorized" });
    });
  
    test("should return group authorization with expired date", () => {
      const mockReq = {
        cookies: { accessToken: "testerAccessTokenValid", refreshToken: "testerRefreshTokenValid" },
      };
      const mockRes = {};
      const decodedAccessToken = {
        email: "tester@test.com",
        username: "tester",
        role: "Regular",
        exp: 0,
      };
      const decodedRefreshToken = {
        email: "tester@test.com",
        username: "tester",
        role: "Regular",
      };
  
      jwt.verify.mockReturnValueOnce(decodedAccessToken);
      jwt.verify.mockReturnValueOnce(decodedRefreshToken);
  
      const response = verifyAuth(mockReq, mockRes, {
        authType: "Group",
        username: "tester",
        emails: ["tester@test.com"],
      });
      expect(response).toEqual({ authorized: true, cause: "Authorized" });
    });
  
    test("should return user not in group", () => {
      const mockReq = {
        cookies: { accessToken: "testerAccessTokenValid", refreshToken: "testerRefreshTokenValid" },
      };
      const mockRes = {};
      const decodedAccessToken = {
        email: "tester@test.com",
        username: "tester",
        role: "Regular",
      };
      const decodedRefreshToken = {
        email: "tester@test.com",
        username: "tester",
        role: "Regular",
      };
  
      jwt.verify.mockReturnValueOnce(decodedAccessToken);
      jwt.verify.mockReturnValueOnce(decodedRefreshToken);
  
      const response = verifyAuth(mockReq, mockRes, {
        authType: "Group",
        username: "tester2",
        emails: ["wrong@test.com"],
      });
      expect(response).toEqual({ authorized: false, cause: "unauthorized, you are not part of the requested group" });
    });
  
    test("should return user authorization", () => {
      const mockReq = {
        cookies: { accessToken: "testerAccessTokenValid", refreshToken: "testerRefreshTokenValid" },
      };
      const mockRes = {
        cookie: jest.fn(),
        locals: {
          refreshTokenMessage: {},
        },
      };
      const decodedAccessToken = {
        email: "tester@test.com",
        username: "tester",
        role: "Regular",
      };
      const decodedRefreshToken = {
        email: "tester@test.com",
        username: "tester",
        role: "Regular",
      };
  
      const error = new Error("Token expired");
      error.name = "TokenExpiredError";
  
      jest.spyOn(jwt, "verify").mockImplementationOnce(() => {
        throw error;
      });
      jwt.verify.mockReturnValueOnce(decodedRefreshToken);
      jwt.sign.mockReturnValueOnce(decodedAccessToken);
  
      const response = verifyAuth(mockReq, mockRes, { authType: "User", username: "tester" });
      expect(response).toEqual({ authorized: true, cause: "Authorized" });
    });
  
    test("should raise error and suggest to perform login", () => {
      const mockReq = {
        cookies: { accessToken: "testerAccessTokenValid", refreshToken: "testerRefreshTokenValid" },
      };
      const mockRes = { cookie: jest.fn() };
      const decodedAccessToken = {
        email: "tester@test.com",
        username: "tester",
        role: "Regular",
      };
      const decodedRefreshToken = {
        email: "tester@test.com",
        username: "tester",
        role: "Regular",
      };
  
      const error = new Error("Token expired");
      error.name = "TokenExpiredError";
  
      jest.spyOn(jwt, "verify").mockImplementation(() => {
        throw error;
      });
  
      const response = verifyAuth(mockReq, mockRes, { authType: "User", username: "tester" });
      expect(response).toEqual({ authorized: false, cause: "Perform login again" });
    });
  
    test("should raise error", () => {
      const mockReq = {
        cookies: { accessToken: "testerAccessTokenValid", refreshToken: "testerRefreshTokenValid" },
      };
      const mockRes = { cookie: jest.fn() };
      const decodedAccessToken = {
        email: "tester@test.com",
        username: "tester",
        role: "Regular",
      };
      const decodedRefreshToken = {
        email: "tester@test.com",
        username: "tester",
        role: "Regular",
      };
  
      const error = new Error("Token expired");
      error.name = "TokenExpiredError";
  
      jest.spyOn(jwt, "verify").mockImplementationOnce(() => {
        throw error;
      });
      jest.spyOn(jwt, "verify").mockImplementationOnce(() => {
        throw new Error();
      });
  
      const response = verifyAuth(mockReq, mockRes, { authType: "User", username: "tester" });
      expect(response).toEqual({ authorized: false, cause: "Error" });
    });
  
    test("should raise error", () => {
      const mockReq = {
        cookies: { accessToken: "testerAccessTokenValid", refreshToken: "testerRefreshTokenValid" },
      };
      const mockRes = { cookie: jest.fn() };
      const decodedAccessToken = {
        email: "tester@test.com",
        username: "tester",
        role: "Regular",
      };
      const decodedRefreshToken = {
        email: "tester@test.com",
        username: "tester",
        role: "Regular",
      };
      jest.spyOn(jwt, "verify").mockImplementationOnce(() => {
        throw new Error();
      });
  
      const response = verifyAuth(mockReq, mockRes, { authType: "User", username: "tester" });
      expect(response).toEqual({ authorized: false, cause: "Error" });
    });
  }) ;
  
  describe("handleAmountFilterParams", () => {
    test.only("Function called with either min and/or max should return a filter object with mix and/or max attributes", () => {
      const reqs = [
        { query: { min: "10" } },
        { query: { max: "10" } },
        { query: { min: "10", max: "20" } },
      ];
      for (let i = 0; i < 3; i++) {
        const res = handleAmountFilterParams(reqs[i]);
        expect(res).toHaveProperty("amount");
        if (reqs[i].query.min) {
          expect(res.amount).toHaveProperty("$gte");
          expect(res.amount.$gte).toEqual(parseFloat(reqs[i].query.min));
        }
        if (reqs[i].query.max) {
          expect(res.amount).toHaveProperty("$lte");
          expect(res.amount.$lte).toEqual(parseFloat(reqs[i].query.max));
        }
      }
    });
  
    test.only("Should throw an error if min or max are passed with strings that do cannot be parsed as number", () => {
      // null and undefined are ignored by the function
      const req1 = { query: { min: "invalid" } };
      const req2 = { query: { max: "invalid" } };
      const req3 = { query: { min: "invalid", max: "20" } };
      expect(() => handleAmountFilterParams(req1)).toThrow();
      expect(() => handleAmountFilterParams(req2)).toThrow();
      expect(() => handleAmountFilterParams(req3)).toThrow();
    });
  });
  