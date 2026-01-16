import mongoose, {Schema} from "mongoose";


const likeSchema = new Schema({
    likedItem:{
        type:Schema.Types.ObjectId,
        required:true,
        refPath:"likedItemModel"
    },
    likedItemModel:{
        type:String,
        required:true,
        enum:["Video","Tweet","Comment"]
    },
    likedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required:true
    },
    
}, {timestamps: true})
likeSchema.index(
    {likedItem:1,likedItemModel:1,likedBy:1},
    {unique:true}
)
export const Like = mongoose.model("Like", likeSchema)