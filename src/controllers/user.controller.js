import { asyncHandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefereshTokens = async (userId) => {
	try {
		const user = await User.findById(userId);
		const accessToken = user.generateAccessToken();
		const refreshToken = user.generateRefreshToken();

		user.refreshToken = refreshToken;
		await user.save({ validateBeforeSave: false });
		return { accessToken, refreshToken };
	} catch (error) {
		throw new ApiError(
			500,
			"Something went wrong while generating refresh and access token and error is: -\n" +
				error
		);
	}
};

const registerUser = asyncHandler(async (req, res) => {
	// get user details from frontend
	// validation - not empty
	// check if user already exists: username, email
	// check for images, check for avatar
	// upload them to cloudinary, avatar
	// create user object - create entry in db
	// remove password and refresh token field from response
	// check for user creation
	// return res

	const { fullName, email, username, password } = req.body;
	//console.log("email: ", email);

	if (
		[fullName, email, username, password].some(
			(field) => field?.trim() === ""
		)
	) {
		throw new ApiError(400, "All fields are required");
	}

	const existedUser = await User.findOne({
		$or: [{ username }, { email }],
	});

	if (existedUser) {
		throw new ApiError(409, "User with email or username already exists");
	}
	//console.log(req.files);

	const avatarLocalPath = req.files?.avatar[0]?.path;
	//const coverImageLocalPath = req.files?.coverImage[0]?.path;

	let coverImageLocalPath;
	if (
		req.files &&
		Array.isArray(req.files.coverImage) &&
		req.files.coverImage.length > 0
	) {
		coverImageLocalPath = req.files.coverImage[0].path;
	}

	if (!avatarLocalPath) {
		throw new ApiError(400, "Avatar file is required");
	}

	const avatar = await uploadOnCloudinary(avatarLocalPath);
	const coverImage = await uploadOnCloudinary(coverImageLocalPath);

	if (!avatar) {
		throw new ApiError(400, "Avatar file is required");
	}

	const user = await User.create({
		fullName,
		avatar: avatar.url,
		coverImage: coverImage?.url || "",
		email,
		password,
		username: username.toLowerCase(),
	});

	const createdUser = await User.findById(user._id).select(
		"-password -refreshToken"
	);

	if (!createdUser) {
		throw new ApiError(
			500,
			"Something went wrong while registering the user"
		);
	}

	return res
		.status(201)
		.json(
			new ApiResponse(200, createdUser, "User registered Successfully")
		);
});

const loginUser = asyncHandler(async (req, res) => {
	// req body -> data
	// username or email
	//find the user
	//password check
	//access and referesh token
	//send cookie

	const { email, username, password } = req.body;

	if (!username && !email) {
		throw new ApiError(400, "username or email is required");
	}

	const user = await User.findOne({
		$or: [{ username }, { email }],
	});

	if (!user) {
		throw new ApiError(404, "User does not exist");
	}

	const isPasswordValid = await user.isPasswordCorrect(password);

	if (!isPasswordValid) {
		throw new ApiError(401, "Invalid user credentials");
	}

	const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
		user._id
	);

	const loggedInUser = await User.findById(user._id).select(
		"-password -refreshToken"
	);

	const options = {
		httpOnly: true,
		secure: true,
	};

	return res
		.status(200)
		.cookie("accessToken", accessToken, options)
		.cookie("refreshToken", refreshToken, options)
		.json(
			new ApiResponse(
				200,
				{
					user: loggedInUser,
					accessToken,
					refreshToken,
				},
				"User logged In Successfully"
			)
		);
});

const logoutUser = asyncHandler(async (req, res) => {
	await User.findByIdAndUpdate(
		req.user._id,
		{
			$set: {
				refreshToken: undefined,
			},
		},
		{
			new: true,
		}
	);

	const options = {
		httpOnly: true,
		secure: true,
	};

	return res
		.status(200)
		.clearCookie("accessToken", options)
		.clearCookie("refreshToken", options)
		.json(new ApiResponse(200, {}, "User logged Out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
	const incomingRefreshToken =
		req.cookies.refreshToken || req.body.refreshToken;

	if (!incomingRefreshToken) throw new ApiError(401, "Unauthorised Request");

	try {
		const decodedToken = jwt.verify(
			incomingRefreshToken,
			process.env.REFRESH_TOKEN_SECRET
		);

		const user = await User.findById(decodedToken?._id);

		if (!user) throw new ApiError(401, "Invalid Refresh Token");

		if (incomingRefreshToken !== user?.refreshToken)
			throw new ApiError(401, "Refresh Token is expired");

		const options = {
			httpOnly: true,
		};

		const { accessToken, newRefreshToken } =
			generateAccessAndRefereshTokens(user._id);

		return res
			.status(200)
			.cookie("accessToken", accessToken, options)
			.cookie("newRefreshToken", newRefreshToken, options)
			.json(
				new ApiResponse(
					200,
					{ accessToken, refreshToken: newRefreshToken },
					"Access Token Refreshed"
				)
			);
	} catch (error) {
		throw new ApiError(401, error?.message || "Invalid Refresh Token");
	}
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
	const { oldPassword, newPassword } = req.body;

	const user = await User.findById(req.user?._id);

	const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

	if (!isPasswordCorrect) throw new ApiError(400, "Invalid Old Password");

	user.password = newPassword;

	await user.save({ validateBeforeSave: false });

	return res
		.status(200)
		.json(new ApiResponse(200, {}, "Password Change Successful"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
	return res
		.status(200)
		.json(
			new ApiResponse(200, req.user, "Current User Fetched Successfully")
		);
});

const updateAccountDetails = asyncHandler(async (req, res) => {
	const { fullname, email } = req.body;

	if (!fullname && !email) {
		throw new ApiError(401, "All fields are required");
	}

	User.findByIdAndUpdate(
		req.user?._id,
		{
			$set: {
				fullname: fullname,
				email: email,
			},
		},

		{
			new: true,
		}
	).select("-password");

	return res
		.status(200)
		.json(new ApiResponse(200, "Acount Details Updated Successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
	const avatarLocalPath = req.file?.path;

	if (!avatarLocalPath) {
		throw new ApiError(400, "Avatar File is Missing");
	}

	// Ideally, we should delete the old Avatar Pic and then proceed
	// For this, we can create a utility function that deletes the
	// old pic and upload the new pic

	// TODO: delete old image

	const avatar = await uploadOnCloudinary(avatarLocalPath);

	if (!avatar.secure_url) {
		throw new ApiError(400, "Error while Uploading Avatar");
	}

	const user = await User.findByIdAndUpdate(
		req.user?._id,
		{
			$set: {
				avatar: avatar.secure_url,
			},
		},
		{
			new: true,
		}
	).select("-password");

	return res
		.status(200)
		.json(new ApiResponse(200, user, "Avatar updated Successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
	const coverImageLocalPath = req.file?.path;

	if (!coverImageLocalPath) {
		throw new ApiError(400, "CoverImage is Missing");
	}

	const coverImage = await uploadOnCloudinary(coverImageLocalPath);

	if (!coverImage.secure_url) {
		throw new ApiError(400, "Error while Uploading CoverImage");
	}

	const user = await User.findByIdAndUpdate(
		req.user?._id,
		{
			$set: {
				coverImage: coverImage.secure_url,
			},
		},
		{
			new: true,
		}
	).select("-password");

	return res
		.status(200)
		.json(new ApiResponse(200, user, "Cover Image update Successful"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
	const { username } = req.params;

	if (!username?.trim()) throw new ApiError(400, "No username exists");

	// We are writing below the mongoDB Aggregation Pipeline
	const channel = await User.aggregate([
		{
			$match: {
				username: username?.toLowerCase(),
			},
		},
		{
			$lookup: {
				from: "Subscription",
				localField: "_id",
				foreignField: "channel",
				as: "subscribers",
			},
		},
		{
			$lookup: {
				from: "Subscription",
				localField: "_id",
				foreignField: "subscriber",
				as: "subscribedTo",
			},
		},
		{
			$addFields: {
				subscribersCount: {
					$size: "$subscribers",
				},

				channelsSubscribedToCount: {
					$size: "$subscribedTo",
				},

				isSubscribed: {
					$cond: {
						if: { $in: [req.user?._id, "$subscribers.subscriber"] },
						then: true,
						else: false,
					},
				},
			},
		},
		{
			$project: {
				fullName: 1,
				username: 1,
				subscribersCount: 1,
				channelsSubscribedToCount: 1,
				isSubscribed: 1,
				avatar: 1,
				coverImage: 1,
				email: 1,
			},
		},
	]);

	if (!channel?.length) {
		throw new ApiError(400, "Channel doesn't exist");
	}

	return res
		.status(200)
		.json(
			new ApiResponse(
				200,
				channel[0],
				"User Channel Fetched Successfully"
			)
		);

	// we will print this for debugging purpose
	// console.log(channel);
});

export {
	registerUser,
	loginUser,
	logoutUser,
	refreshAccessToken,
	changeCurrentPassword,
	getCurrentUser,
	updateUserAvatar,
	updateAccountDetails,
	updateUserCoverImage,
	getUserChannelProfile,
};
