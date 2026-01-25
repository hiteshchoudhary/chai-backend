import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";

const checkValidObjectId= (givenObjectId) => (req, _ , next) =>{
    const isValid = givenObjectId.find(id => !mongoose.isValidObjectId(req.params[id]))
    
    if(isValid){
        throw new ApiError(400, `Invalid ${isValid}`)
    }

    next()
}

export default checkValidObjectId