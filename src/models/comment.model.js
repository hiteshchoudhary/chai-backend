import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema = new Schema(
  {
    content: {
      type: String,
      required: true,
    },
    // This is for video
    video: {
      type: Schema.Types.ObjectId,
      ref: "Video",
    },
    // This is for tweet
    tweet: {
      type: Schema.Types.ObjectId,
      ref: "Tweet",
    },
    commentedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

commentSchema.plugin(mongooseAggregatePaginate);

export const Comment = mongoose.model("Comment", commentSchema);
