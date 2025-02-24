import { asyncHandler } from "../utils/asynchandler.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";

// This middleware checks if user is logged in or not
export const verifyJWT = asyncHandler(async (req, _, next) => {
	// We are extracting the AcessToken of the user
	// because req has "cookies" property. This is made possible
	// because of cookie-parser

	// req.header("Authorization")?.replace("Bearer ", "");
	// Above is used when in case User is sending a custom header
	// This is prevalent in mobile dev scenario
	try {
		const token =
			req.cookies?.accessToken ||
			req.header("Authorization")?.replace("Bearer ", "");

		console.log("token: " + token);

		console.log("Token Val: " + token);

		if (!token) {
			throw new ApiError(401, "Unauthorised Request");
		}

		// We are verifying the extracted Access Token here
		const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

		const user = await User.findById(decodedToken?._id).select(
			"-password -refreshToken"
		);

		if (!user) {
			// NEXT_VIDEO (Video No 17): discuss about frontend
			throw new ApiError(401, "Invalid Access Token");
		}

		// By writing req.user, we are assigning a new object to "req"
		// Instead of req.user, we can write anything like : - req.u1, etc

		req.user = user;
		next();
	} catch (error) {
		throw new ApiError(401, error?.message || "Invalid Access Token");
	}
});
