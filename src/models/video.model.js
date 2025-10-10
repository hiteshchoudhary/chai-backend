<<<<<<< HEAD
import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
    {
        videoFile: {
            type: String, //cloudinary url
            required: true
        },
        thumbnail: {
            type: String, //cloudinary url
            required: true
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
=======
import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const videoSchema = new Schema(

    {
        videoFile: {
            type: String, // cloudinary url
            required: true,

        },
        thumbnail: {
            type: String, // cloudinary url
            required: true,

        },

        title: {
            type: String,
            required: true,

        },
        decription: {
            type: String,
            required: true,

        },

        duration: {
            type: Number, // cloudinary url 
>>>>>>> myrepo/main
            required: true
        },
        views: {
            type: Number,
<<<<<<< HEAD
            default: 0
        },
        isPublished: {
            type: Boolean,
            default: true
        },
=======
            default: 0,
        },

        isPublished: {
            type: Boolean,
            default: true,
        },

>>>>>>> myrepo/main
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User"
        }

<<<<<<< HEAD
    }, 
    {
        timestamps: true
    }
=======




    }, { timestamps: true }
>>>>>>> myrepo/main
)

videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video", videoSchema)