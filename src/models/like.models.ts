import { Document, Schema, model } from "mongoose";

interface ILike extends Document {
  comment: Schema.Types.ObjectId;
  video: Schema.Types.ObjectId;
  likedBy: Schema.Types.ObjectId;
  tweet: Schema.Types.ObjectId;
}


const likeSchema = new Schema<ILike>(
  {
    comment: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
    },
    video: {
      type: Schema.Types.ObjectId,
      ref: "Video",
    },
    likedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    tweet: {
      type: Schema.Types.ObjectId,
      ref: "Tweet",
    },
  },
  { timestamps: true }
);

export const Like = model<ILike>("Like", likeSchema);
