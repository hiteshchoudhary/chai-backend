import mongoose, {mongo, Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
import { Counter } from "./counter.model.js";

const videoSchema = new Schema(
    {
         numberID: {
            type: Number,
            unique: true,
        },

        videoFile: {
            type: String, //cloudinary url
            required: true
        },
        thumbnail: {
            type: String, //cloudinary url
            required: true
        },
        isShorts: {
            type:Boolean,
            default: false,
            required:true
        },
        title: {
            type: String, 
            required: true
        },
        description: {
            type: String, 
            required: true
        },
        duration: {
            type: Number, 
        },
        views: {
            type: Number,
            default: 0
        },
        isPublished: {
            type: Boolean,
            default: true
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    },
 
    {
        timestamps: true
    }
)

videoSchema.pre("save", async function (next) {
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


videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video", videoSchema)
