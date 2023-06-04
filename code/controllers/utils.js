import jwt from "jsonwebtoken";

/**
 * Handle possible date filtering options in the query parameters for getTransactionsByUser when called by a Regular user.
 * @param req the request object that can contain query parameters
 * @returns an object that can be used for filtering MongoDB queries according to the `date` parameter.
 *  The returned object must handle all possible combination of date filtering parameters, including the case where none are present.
 *  Example: {date: {$gte: "2023-04-30T00:00:00.000Z"}} returns all transactions whose `date` parameter indicates a date from 30/04/2023 (included) onwards
 * @throws an error if the query parameters include `date` together with at least one of `from` or `upTo`
 * 
- Returns an object with a `date` attribute used for filtering mongoDB's `aggregate` queries
- The value of `date` is an object that depends on the query parameters:
  - If the query parameters include `from` then it must include a `$gte` attribute that specifies the starting date as a `Date` object in the format **YYYY-MM-DDTHH:mm:ss**
    - Example: `/api/users/Mario/transactions?from=2023-04-30` => `{date: {$gte: 2023-04-30T00:00:00.000Z}}`
  - If the query parameters include `upTo` then it must include a `$lte` attribute that specifies the ending date as a `Date` object in the format **YYYY-MM-DDTHH:mm:ss**
    - Example: `/api/users/Mario/transactions?upTo=2023-05-10` => `{date: {$lte: 2023-05-10T23:59:59.000Z}}`
  - If both `from` and `upTo` are present then both `$gte` and `$lte` must be included
  - If `date` is present then it must include both `$gte` and `$lte` attributes, these two attributes must specify the same date as a `Date` object in the format **YYYY-MM-DDTHH:mm:ss**
    - Example: `/api/users/Mario/transactions?date=2023-05-10` => `{date: {$gte: 2023-05-10T00:00:00.000Z, $lte: 2023-05-10T23:59:59.000Z}}`
  - If there is no query parameter then it returns an empty object
    - Example: `/api/users/Mario/transactions` => `{}`
- Throws an error if `date` is present in the query parameter together with at least one of `from` or `upTo`
- Throws an error if the value of any of the three query parameters is not a string that represents a date in the format **YYYY-MM-DD**
 */
export const handleDateFilterParams = (req) => {
  const filter = {};

  const { date, from, upTo } = req.query;

  if (date && (from || upTo)) {
    throw new Error(
      'Invalid query parameters. Cannot use "date" together with "from" or "upTo".'
    );
  }

  if (date) {
    filter.date = {
      $gte: new Date(`${date}T00:00:00.000Z`),
      $lte: new Date(`${date}T23:59:59.999Z`),
    };
  } else if (from && upTo) {
    filter.date = {
      $gte: new Date(`${from}T00:00:00.000Z`),
      $lte: new Date(`${upTo}T23:59:59.999Z`),
    };
  } else if (from) {
    filter.date = { $gte: new Date(`${from}T00:00:00.000Z`) };
  } else if (upTo) {
    filter.date = { $lte: new Date(`${upTo}T23:59:59.999Z`) };
  }

  return filter;
};

/**
 * Handle possible authentication modes depending on `authType`
 * @param req the request object that contains cookie information
 * @param res the result object of the request
 * @param info an object that specifies the `authType` and that contains additional information, depending on the value of `authType`
 *      Example: {authType: "Simple"}
 *      Additional criteria:
 *          - authType === "User":
 *              - either the accessToken or the refreshToken have a `username` different from the requested one => error 401
 *              - the accessToken is expired and the refreshToken has a `username` different from the requested one => error 401
 *              - both the accessToken and the refreshToken have a `username` equal to the requested one => success
 *              - the accessToken is expired and the refreshToken has a `username` equal to the requested one => success
 *          - authType === "Admin":
 *              - either the accessToken or the refreshToken have a `role` which is not Admin => error 401
 *              - the accessToken is expired and the refreshToken has a `role` which is not Admin => error 401
 *              - both the accessToken and the refreshToken have a `role` which is equal to Admin => success
 *              - the accessToken is expired and the refreshToken has a `role` which is equal to Admin => success
 *          - authType === "Group":
 *              - either the accessToken or the refreshToken have a `email` which is not in the requested group => error 401
 *              - the accessToken is expired and the refreshToken has a `email` which is not in the requested group => error 401
 *              - both the accessToken and the refreshToken have a `email` which is in the requested group => success
 *              - the accessToken is expired and the refreshToken has a `email` which is in the requested group => success
 * @returns true if the user satisfies all the conditions of the specified `authType` and false if at least one condition is not satisfied
 *  Refreshes the accessToken if it has expired and the refreshToken is still valid
 * 
 - Verifies that the tokens present in the request's cookies allow access depending on the different criteria.
- Returns an object with a boolean `flag` that specifies whether access is granted or not and a `cause` that describes the reason behind failed authentication
  - Example: `{flag: false, cause: "Unauthorized"}`
- Refreshes the `accessToken` if it has expired and the `refreshToken` allows authentication; sets the `refreshedTokenMessage` to inform users that the `accessToken` must be changed
 */
export const verifyAuth = (req, res, info) => {
  const info1 = { info };

  const cookie = req.cookies;
  if (!cookie.accessToken || !cookie.refreshToken) {
    return { authorized: false, cause: "Unauthorized" };
  }
  try {
    const decodedAccessToken = jwt.verify(
      cookie.accessToken,
      process.env.ACCESS_KEY
    );
    const decodedRefreshToken = jwt.verify(
      cookie.refreshToken,
      process.env.ACCESS_KEY
    );
    if (
      !decodedAccessToken.username ||
      !decodedAccessToken.email ||
      !decodedAccessToken.role
    ) {
      return { authorized: false, cause: "Token is missing information" };
    }
    if (
      !decodedRefreshToken.username ||
      !decodedRefreshToken.email ||
      !decodedRefreshToken.role
    ) {
      return { authorized: false, cause: "Token is missing information" };
    }
    if (
      decodedAccessToken.username !== decodedRefreshToken.username ||
      decodedAccessToken.email !== decodedRefreshToken.email ||
      decodedAccessToken.role !== decodedRefreshToken.role
    ) {
      return { authorized: false, cause: "Mismatched users" };
    }

    const authType = info1.info.authType;
    switch (authType) {
      case "Simple":
        return { authorized: true, cause: "Authorized" };

      case "User":
        const username = info1.info.username;
        if (
          username !== decodedAccessToken.username ||
          username !== decodedRefreshToken
        ) {
          return {
            authorized: false,
            cause: "username does not match the related user's token",
          };
        } else {
          return { authorized: true, cause: "Authorized" };
        }

      case "Admin":
        if (
          decodedAccessToken.role !== "Admin" ||
          decodedRefreshToken.role !== "Admin"
        ) {
          return {
            authorized: false,
            cause: "function reserved for admins only",
          };
        } else {
          return { authorized: true, cause: "Authorized" };
        }

      case "Group":
        const emails = info1.info.emails;
        const find = emails.find((x) => x === decodedAccessToken.email);
        const find1 = emails.find((x) => x === decodedRefreshToken.email);
        if (!find || !find1) {
          return {
            authorized: false,
            cause: "unauthorized, you are not part of the requested group",
          };
        } else {
          return { authorized: true, cause: "Authorized" };
        }

      default:
        return { authorized: false, cause: "invalid authentication type" };
    }
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      try {
        const refreshToken = jwt.verify(
          cookie.refreshToken,
          process.env.ACCESS_KEY
        );
        const newAccessToken = jwt.sign(
          {
            username: refreshToken.username,
            email: refreshToken.email,
            id: refreshToken.id,
            role: refreshToken.role,
          },
          process.env.ACCESS_KEY,
          { expiresIn: "1h" }
        );
        res.cookie("accessToken", newAccessToken, {
          httpOnly: true,
          path: "/api",
          maxAge: 60 * 60 * 1000,
          sameSite: "none",
          secure: true,
        });
        res.locals.refreshedTokenMessage =
          "Access token has been refreshed. Remember to copy the new one in the headers of subsequent calls";
        return { authorized: true, cause: "Authorized" };
      } catch (err) {
        if (err.name === "TokenExpiredError") {
          return { authorized: false, cause: "Perform login again" };
        } else {
          return { authorized: false, cause: err.name };
        }
      }
    } else {
      return { authorized: false, cause: err.name };
    }
  }
};

/**
 * Handle possible amount filtering options in the query parameters for getTransactionsByUser when called by a Regular user.
 * @param req the request object that can contain query parameters
 * @returns an object that can be used for filtering MongoDB queries according to the `amount` parameter.
 *  The returned object must handle all possible combination of amount filtering parameters, including the case where none are present.
 *  Example: {amount: {$gte: 100}} returns all transactions whose `amount` parameter is greater or equal than 100
 * 
- Returns an object with an `amount` attribute used for filtering mongoDB's `aggregate` queries
- The value of `amount` is an object that depends on the query parameters:
  - If the query parameters include `min` then it must include a `$gte` attribute that is an integer equal to `min`
    - Example: `/api/users/Mario/transactions?min=10` => `{amount: {$gte: 10} }
  - If the query parameters include `min` then it must include a `$lte` attribute that is an integer equal to `max`
    - Example: `/api/users/Mario/transactions?min=50` => `{amount: {$lte: 50} }
  - If both `min` and `max` are present then both `$gte` and `$lte` must be included
- Throws an error if the value of any of the two query parameters is not a numerical value
 */
export const handleAmountFilterParams = (req) => {
  const filter = {};

  const { min, max } = req.query;

    const handleNumericValue = (value) => {
      if (isNaN(parseFloat(value))) {
        throw new Error(`Invalid value`);
      }
      const numericValue = parseFloat(value);
      return numericValue;
    };

    if (min && max) {
      filter.amount = { $gte: handleNumericValue(min), $lte: handleNumericValue(max) };
    } else if (min) {
      filter.amount = { $gte: handleNumericValue(min) };
    } else if (max) {
      filter.amount = { $lte: handleNumericValue(max) };
    }
  
    return filter;
  };
  
  export const isValidEmail = (email) => {
    const emailformat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailformat.test(email);
  };
  
