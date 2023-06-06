import {
    handleDateFilterParams,
    verifyAuth,
    handleAmountFilterParams,
  } from "../controllers/utils";
  
  beforeAll(() => {
    jest.clearAllMocks();
  });
  
  describe("handleDateFilterParams", () => {
    test(`Returns a filter object which contains data attribute if only "date" is present in query`, () => {
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
  
    test(`Throws an error if at least one of the query parameters is not a date in the format "YYYY-MM-DD"`, () => {
      //The date is in the correct format but is not an actual date (there are only twelve months)
      const req1 = { query: { date: "2023-13-21" } };
      //The date is valid but is not in the correct formant
      const req2 = { query: { upTo: "21-03-2023" } };
      expect(() => handleDateFilterParams(req1)).toThrow();
      expect(() => handleDateFilterParams(req2)).toThrow();
    });
  
    test(`Throws an error if in the query "date" parameter is present with either "from" or "upTo"`, () => {
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
    test("Dummy test, change it", () => {
      expect(true).toBe(true);
    });
  });
  
  describe("handleAmountFilterParams", () => {
    test("Function called with either min and/or max should return a filter object with mix and/or max attributes", () => {
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
  
    test("Should throw an error if min or max are passed with strings that do cannot be parsed as number", () => {
      // null and undefined are ignored by the function
      const req1 = { query: { min: "invalid" } };
      const req2 = { query: { max: "invalid" } };
      const req3 = { query: { min: "invalid", max: "20" } };
      expect(() => handleAmountFilterParams(req1)).toThrow();
      expect(() => handleAmountFilterParams(req2)).toThrow();
      expect(() => handleAmountFilterParams(req3)).toThrow();
    });
  });
  