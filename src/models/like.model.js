<<<<<<< HEAD
import mongoose, {Schema} from "mongoose";
=======
import mongoose, { Schema } from "mongoose";
>>>>>>> myrepo/main


const likeSchema = new Schema({
    video: {
        type: Schema.Types.ObjectId,
        ref: "Video"
    },
    comment: {
        type: Schema.Types.ObjectId,
        ref: "Comment"
    },
    tweet: {
        type: Schema.Types.ObjectId,
        ref: "Tweet"
    },
    likedBy: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
<<<<<<< HEAD
    
}, {timestamps: true})
=======


},
    { timestamps: true }


)

>>>>>>> myrepo/main

export const Like = mongoose.model("Like", likeSchema)