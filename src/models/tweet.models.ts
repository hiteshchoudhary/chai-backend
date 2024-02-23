import { Schema, model } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

export interface ITweet extends Document {
  content: string;
  owner: Schema.Types.ObjectId;
}

const tweetSchema = new Schema<ITweet>(
  {
    content: {
      type: String,
      required: [true, "content is required"],
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

tweetSchema.plugin(mongooseAggregatePaginate);

export const Tweet = model<ITweet>("Tweet", tweetSchema);
