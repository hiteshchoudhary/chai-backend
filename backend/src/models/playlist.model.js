import mongoose, {Schema} from "mongoose";
import { Counter } from "./counter.model.js";
const playlistSchema = new Schema({
    numberID: {
            type: Number,
            unique: true,
    },
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

playlistSchema.pre("save", async function (next) {
  if (this.isNew) {
    const counter = await Counter.findByIdAndUpdate(
      { _id: "numberID" },        // counter name
      { $inc: { seq: 1 } },     // increment by 1
      { new: true, upsert: true }
    );

    this.numberID = counter.seq; // assign new number
  }
  next();
});


export const Playlist = mongoose.model("Playlist", playlistSchema)