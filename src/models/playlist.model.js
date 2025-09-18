import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const playlistSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    videos: [
        {
            type: Schema.Types.ObjectId,
            ref: "Video"
        }
    ],
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
}, {timestamps: true})

playlistSchema.plugin(mongooseAggregatePaginate);
playlistSchema.methods.validateOwner = function (userId) {
  return this.owner.toString() === userId.toString();
};
export const Playlist = mongoose.model("Playlist", playlistSchema)