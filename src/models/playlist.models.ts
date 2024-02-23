import { Document, Schema, model } from "mongoose";

export interface IPlaylist extends Document {
  name: string;
  description: string;
  videos: Schema.Types.ObjectId[];
  owner: Schema.Types.ObjectId;
  isPublished: boolean;
}

const playlistSchema = new Schema<IPlaylist>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    videos: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const Playlist = model<IPlaylist>("Playlist", playlistSchema);
