import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new mongoose.Schema(
	{
		videoFile: {
			type: String, //Cloudinary URL
			required: [true, "VideoURL not provided"],
		},

		thumbnail: {
			type: String, //Cloudinary URL
			required: [true, "Thumbnail not provided"],
		},

		title: {
			type: String,
			required: [true, "Title not provided"],
		},

		description: {
			type: String,
			required: [true, "Description not provided"],
		},

		duration: {
			type: Number,
			required: true,
		},

		views: {
			type: Number,
			default: 0,
		},

		isPublished: {
			type: Boolean,
			default: true,
		},

		owner: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
		},
	},
	{ timestamps: true }
);

// videoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model("Video", videoSchema);
