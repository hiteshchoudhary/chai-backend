import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const movieSchema = new mongoose.Schema({
  title : { type: String, required: true },  
  description: { type: String, required: true },
  price: {type: String, required: true},
  genre: [{ type: String }],
  duration: { type: Number,},
  movieUrl: { type: String, required: true },
  movieThumbnail: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  views: { type: Number, default: 0 },
  isPublished: { type: Boolean, default: false },
}, { timestamps: true });

movieSchema.plugin(mongooseAggregatePaginate)


export const Movie = mongoose.model("Movies", movieSchema)