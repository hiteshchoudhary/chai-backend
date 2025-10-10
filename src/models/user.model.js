<<<<<<< HEAD
import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const userSchema = new Schema(
=======
import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
const userSchema = new Schema(

>>>>>>> myrepo/main
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
<<<<<<< HEAD
            trim: true, 
            index: true
        },
=======
            trim: true,
            index: true,
            // index:true is used if there is lot of searching in the field  
        },

>>>>>>> myrepo/main
        email: {
            type: String,
            required: true,
            unique: true,
<<<<<<< HEAD
            lowecase: true,
            trim: true, 
        },
        fullName: {
            type: String,
            required: true,
            trim: true, 
            index: true
        },
        avatar: {
            type: String, // cloudinary url
            required: true,
        },
        coverImage: {
            type: String, // cloudinary url
        },
        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        password: {
            type: String,
            required: [true, 'Password is required']
        },
        refreshToken: {
            type: String
        }

    },
    {
        timestamps: true
    }
)

userSchema.pre("save", async function (next) {
    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10)
    next()
})

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
=======
            lowercase: true,
            trim: true,
        },

        fullName: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        avatar: {
            type: String, // cloudinary url 
            required: true,
        },

        coverImage: {
            type: String, // cloudinary url 
        },

        watchHistory: [{
            type: Schema.Types.ObjectId,
            ref: "Video"
        },],

        password: {
            type: String,
            // required: [true, 'Password is required']
            required: true,


        },

        refreshToken: {
            type: String,

        }




    }, { timestamps: true }

)
// Here callback function is not arrow function because 
// arrow function does not has 'this' reference 
// Therefore normal function is used here 
// .pre() is the middleware also called as hooks 
userSchema.pre('save', async function (next) {

    if (this.isModified("password")) { // This if loop is because , when there will be changes in password or password is enter the first time  , then only the following hook of encrypting password is used 

        this.password = await bcrypt.hash(this.password, 10) // 10 here is number of rounds 
        next()
        /*
                The next() function is a callback provided by Mongoose.
                It’s how you tell Mongoose:
                👉 “I’m done with whatever I was doing in this hook, now move on to the next middleware or finish the operation.”
        */
    }

})
// These are the custom methods which i have created 
// This is the method to validate the password 
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
    // it returns true or false 
}
// No need for async 
userSchema.methods.generateAccessToken = function () {
    return jwt.sign({
        _id: this._id,
        email: this.email,
        username: this.username,
        fullName: this.fullName,
    },
        process.env.ACCESS_TOKEN_SECRET,


>>>>>>> myrepo/main
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
<<<<<<< HEAD
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            
        },
        process.env.REFRESH_TOKEN_SECRET,
=======

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign({
        _id: this._id,
    },
        process.env.REFRESH_TOKEN_SECRET,


>>>>>>> myrepo/main
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
<<<<<<< HEAD
}

=======



}






>>>>>>> myrepo/main
export const User = mongoose.model("User", userSchema)