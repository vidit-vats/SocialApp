import { v2 as cloudinary } from "cloudinary";
import { publicDecrypt } from "crypto";
import fs from "fs";

// Configuration
cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
	try {
		if (!localFilePath) return null;

		const response = await cloudinary.uploader.upload(localFilePath, {
			resource_type: "auto",
		});

		console.log(`Response: ${response}`);

		// File has been uploaded  successfully
		console.log("URL: " + response);

		// We are writing below line to delete the file from /public/temp
		// because the upload was successfull

		fs.unlinkSync(localFilePath);
		return response;
	} catch (error) {
		// This below method removes the locally saved temp file as the
		// upload op got failed
		fs.unlinkSync(localFilePath);

		return null;
	}
};

// const uploadResult = await cloudinary.uploader
// 	.upload(
// 		"https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg",
// 		{
// 			public_id: "shoes",
// 		}
// 	)
// 	.catch((error) => {
// 		console.log(error);
// 	});

export { uploadOnCloudinary };
