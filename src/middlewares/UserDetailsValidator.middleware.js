import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import emailValidator from 'email-validator'

// register validator 
const registerValidator = asyncHandler(async(req,_,next)=>{

    const {fullName, email, password,username} = req.body

    try {
        if(
            [fullName, password, username, email].some((eachField)=>{
                return eachField?.trim()===""
            })
        ){
            throw new ApiError(400, "Every fields are required")
        }
        const isValidEmail = emailValidator.validate(email)
        if(!isValidEmail){
            throw new ApiError(400, "Provide Valid Email")
        }
        // check user already exists 
        const isAlreadyExists = await User.findOne({
            $or: [{username},{email}]
        })
        if(isAlreadyExists){
            throw new ApiError(409, "this username or email already exist")
        }
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "register validation: Invalid Information")
    }
})

// login validator

const loginValidator = asyncHandler(async(req,res,next)=>{

    const {email , username, password} = req.body;
    if(!(username || email)){
        throw new ApiError(400, "username or email is required");
     }

    try {
         // find the user 
        const user = await User.findOne({
            $or: [{username},{email}]
        })

        //check the user exists or not 
        if(!user){
            throw new ApiError(404, "User does not exist")
        }

        //check the password
        const isPasswordValid = await user.isPasswordCorrect(password)
        if(!isPasswordValid){
            throw new ApiError(401, "Password is not correct");
        }
        req.user = user
        next()
     } catch (error) {
        throw new ApiError(401, error?.message || "Login validation:Invalid Information")
     }
})

export {
    registerValidator,
    loginValidator
}