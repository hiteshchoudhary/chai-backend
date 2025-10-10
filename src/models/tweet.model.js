<<<<<<< HEAD
import mongoose, {Schema} from "mongoose";
=======
import mongoose, { Schema } from "mongoose";
>>>>>>> myrepo/main

const tweetSchema = new Schema({
    content: {
        type: String,
        required: true
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
<<<<<<< HEAD
    }
}, {timestamps: true})
=======
    },

    //  I have added this in my schema to trace the name of the tweet creater 
    name: {
        type: String,

    }
}, { timestamps: true })
>>>>>>> myrepo/main


export const Tweet = mongoose.model("Tweet", tweetSchema)