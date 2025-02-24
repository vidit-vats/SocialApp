import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

// index : true is used for better searching on the field in optimised way
// Study DB Indexes for more

const userSchema = new mongoose.Schema(
	{
		username: {
			type: String,
			required: true,
			lowercase: true,
			unique: true,
			trim: true,
			index: true,
		},

		email: {
			type: String,
			required: true,
			lowercase: true,
			unique: true,
			trim: true,
			index: true,
		},

		fullname: {
			type: String,
			required: true,
			trim: true,
			index: true,
		},

		avatar: {
			type: String, //Cloudinary URL
			required: true,
		},

		coverImage: {
			type: String,
			// required: true,
		},

		watchHistory: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Video",
			},
		],

		password: {
			type: String,
			required: [true, "Password is required"],
		},

		refreshToken: {
			type: String,
		},
	},
	{ timestamps: true }
);

// Important Point: - Access Tokens are short-lived whereas Refresh Tokens are long-lived

// Access Token is used to give access if user is authenticated
// Refresh Token is saved on DB as well as on user machine

// User is validated using access token but if it has refresh token then it can be validated using that too

// dont write arrow function here because it does not know about 'this' context
userSchema.pre("save", async function (next) {
	if (!this.isModified("password")) return next();
	this.password = await bcrypt.hash(this.password, 10);
	next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
	// This return true/false
	return await bcrypt.compare(password, this.password);
};

// JWT is a bearer token i.e jiske pas token h use data de dege
// Access Token is not stored in DB
userSchema.methods.generateAccessToken = function () {
	// jwt.sign() is supplied with the attributes / field of our mongoDB model
	return jwt.sign(
		{
			_id: this._id,
			email: this.email,
			username: this.username,
			fullname: this.fullname,
		},
		process.env.ACCESS_TOKEN_SECRET,
		{
			expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
		}
	);
};

// Refresh Token is stored in DB
// Info is also less in Refresh Token. That's why, we store only _id
// Iski expiry bhi zada ki hoti h
userSchema.methods.generateRefreshToken = function () {
	return jwt.sign(
		{
			_id: this._id,
		},
		process.env.REFRESH_TOKEN_SECRET,
		{
			expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
		}
	);
};

export const User = mongoose.model("User", userSchema);
