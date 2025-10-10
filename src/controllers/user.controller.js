import { asyncHandler } from "../utils/asyncHandler.js";
<<<<<<< HEAD
import {ApiError} from "../utils/ApiError.js"
import { User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";


const generateAccessAndRefereshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

const registerUser = asyncHandler( async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res


    const {fullName, email, username, password } = req.body
    //console.log("email: ", email);

    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }
    //console.log(req.files);

    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;
=======
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponses.js";
import { deletefromCloudinary } from "../utils/deleteCloudinary.js";
import jwt from "jsonwebtoken";
// if you are updating some files like coverImage , avatar keep thier end points different 
// By diiferent i mean , there routes will be different 
//router.route("/avatar")
//router.route("/cover-image") 
// This is Because , let's say user wants to update its coverImage ,
// if you put it inside route like login , the whole other data goes with it which is  not optimal 


// So here we will be not using asyncHandler because ...
// We are not dealing with any route request in this method 

const generateAccessAndRefereshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const refreshToken = user.generateRefreshToken();
        const accessToken = user.generateAccessToken()

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false }) // to save the refresh token, but we dont have the other required(compulsory ) fields , that's why validateBeforeSave: false 

        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(490, "Refresh T")
    }



}



const registerUser = asyncHandler(async (req, res) => {
    // get the user details from frontend 
    // this is taken through postman 
    // look how to do file handling 
    // validation - not empty 
    // check if user already exist : username,email // Any field can be used for the checking 
    // check for images , check for avatar 
    // upload these images on cloudinary , and again check whether the avatar is uploaded or not 
    // create user object - create entry in db.   .create()
    // remove password and refresh token field from response 
    // check for user creation 
    // return res 


    const { fullName, email, username, password } = req.body // the data coming from form and json of frontend is catch by req.body 
    // console.log(req.body);
    // console.log(req.files);


    // console.log("email", email);
    // checking every validation manually 
    /* if (fullName === "") {
        throw new ApiError(400, "fullName is required")

    }
*/
    // This are the validation 
    // These is validation to check whether any field is empty or not 
    // These are the required fields
    if (
        [fullName, email, username, password].some((field) => field?.trim() === "") // .some() is the array method 
    ) {
        throw new ApiError(400, "All fields are required ")
    }
    // validation for email address to have "@"
    if (!email.includes("@")) {
        throw new ApiError(408, "Enter a proper Email address  ")
    }

    // To check whether user already exits or not 
    // Now this User thing will call the mongDb in behalf of me whenever i need to 

    const existedUser = await User.findOne({
        $or: [{ username }, { email }] // This $or to check both username and email at the same time 
        // we can also use                const existingUser = await User.findOne({ email });
    }); // User.find() can also be used 

    if (existedUser) {
        throw new ApiError(409, "User with email or username already registered")
    }


    // Correct optional chaining syntax for accessing avatar path
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path
    // req.files is because of multer middleware that we have used 
    // express gives access to req.body


    // we dont have any checks for coverImage is there or not 
    // because adding the cover image is not necessary for our use case for this application 
    // So for that 
>>>>>>> myrepo/main

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
<<<<<<< HEAD
    

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }
   

=======
    // There are may ways to check this coverImage 
    // So the thing with coverImage is , this is not compulsory field(required)
    // So if the user has not uploaded any coverImage , so it should be shown as empty 
    // But this is not the case with avatar 
    // avatar is required field 


    // checking whether the avatar is present or not 
    if (!avatarLocalPath) {
        throw new ApiError(403, "Avatar file is missing ")
    }

    // Uploading these images on cloudinary 
    // Taking thier references in the variables 
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    // Checking the avatar is there or not 
    if (!avatar) {
        throw new ApiError(412, "Avatar has been not uploaded properly on cloudinary ")
    }

    // Create the entry on the database 
    // await is used because while storing , there can be error from the database 
    // Also remember the database is always in different continent 
>>>>>>> myrepo/main
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
<<<<<<< HEAD
        email, 
=======
        email,
>>>>>>> myrepo/main
        password,
        username: username.toLowerCase()
    })

<<<<<<< HEAD
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )

} )

const loginUser = asyncHandler(async (req, res) =>{
    // req body -> data
    // username or email
    //find the user
    //password check
    //access and referesh token
    //send cookie

    const {email, username, password} = req.body
    console.log(email);

    if (!username && !email) {
        throw new ApiError(400, "username or email is required")
    }
    
    // Here is an alternative of above code based on logic discussed in video:
    // if (!(username || email)) {
    //     throw new ApiError(400, "username or email is required")
        
    // }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

   const isPasswordValid = await user.isPasswordCorrect(password)

   if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials")
    }

   const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
=======
    // To see whether this data is created in database or not 
    // The thing is whenever there is a new entry in database there is field of _id generated it with it 
    // So to find whether the entry is created , we will use   User.findById(user._id)
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    // Through .select() we dont want password and refreshToken details 


    if (!createdUser) {
        throw new ApiError(503, "User has not been created on database ")
    }

    // return new ApiResponse(200, createdUser, "User has been created successfully").    this is wrong 
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registered Successfully"))


})

/*  My login method 
const loginUser = asyncHandler(async (req, res) => {
    // req body -> data 
    // username or email 
    // find the user 
    // password check 
    // access and refresh token 
    // send cookie 

    const { email, username, password, fullName } = req.body;
    console.log("Hii i am the response", req.body);

    if (!username || !email) {
        throw new ApiError(457, "Both the username and email are required")
    }
    const existedUser = await User.findOne({
        username, email
    });

    const passwordCheck = await existedUser.isPasswordCorrect(password)
    if (!passwordCheck) {
        throw new ApiError(445, "Password is incorrect")
    }
    // So here we need the both username , email in one collection 
    // which is different case in register User method 

    if (existedUser) {
        return res.status(288).json(
            new ApiResponse(234, User, "Login successfull")
        )

    } else {
        throw new ApiError(443, "User does not exist ")
    }

})
*/

const loginUser = asyncHandler(async (req, res) => {

    // req body -> data 
    // username or email 
    // find the user 
    // password check 
    // access and refresh token 
    // send cookie 

    const { email, username, password } = req.body;

    if (!username && !email) {
        throw new ApiError(400, "username or email is required ")
    }
    // find the entry , which has either username or email which has comne from response (req.body)
    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(404, "User not found")
    }

    const passwordCorrect = await user.isPasswordCorrect(password)
    if (!passwordCorrect) {
        throw new ApiError(444, "Password is not correct ")
    }
    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id)
    // console.log("This is access token", accessToken);
    // console.log("This is refresh token", refreshToken);

    // Access Token is short Lived and Refresh Token is long-lived 
    // The full Stroy of access token and refrsh token Backend Part 2 (1:12:50)
    // Send to the cookie 


    // so this user which we have from database on the line 199 , does not have access Token and refresh token ( part2 backend 27:37 )
    // So we can do two things , we can update this user , which we already have or can again call to the database , which can be expensive(depends on situation to situation )
    // Method of calling to the database - Method 1 
    // Important method for the databse retrieval
    // Model.find(query).select(fields)
    const loggedInUser = await User.findById(user._id).
        select("-password -refreshToken") // This thing is optional

>>>>>>> myrepo/main

    const options = {
        httpOnly: true,
        secure: true
<<<<<<< HEAD
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )

})

const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
=======
    } // through this options we are ensuring that the cookies can be modified from backend only(server only )

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(202, {
            user: loggedInUser, accessToken, refreshToken,
        },
            "User LoggedIn Successfully"
        )
        )


})

const logOutUser = asyncHandler(async (req, res) => {
    // Since your auth uses:
    // Access token → short-lived, no need to "invalidate" it server-side (it just expires).
    // Refresh token (in httpOnly cookie) → this is what keeps the user logged in.
    // 👉 Logout = clear the refresh token so the client can’t request new access tokens.
    // Optionally, also clear refresh token from DB (if you store it)
    await User.findByIdAndUpdate(req.user._id,
        {
            // to clear the refresh token 
            // 1st way 

            // $set: {
            //     refreshToken: ""
            // }

            // 2nd way 
>>>>>>> myrepo/main
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
<<<<<<< HEAD
            new: true
        }
    )

=======
            new: true, // This is to have the return response that will have the updated value of refresh token
        }
    )
    // Sooo here , what we did is through auth.middleware.js we gave req a req.user 
    // Through this we can update the refresh  token 
>>>>>>> myrepo/main
    const options = {
        httpOnly: true,
        secure: true
    }

<<<<<<< HEAD
    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
            
        }
    
=======

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(202, {}, "Logout successful"))
})

// The thing is access Token is for short period 
// After expiration of the access token , we will generate new one ,
// with the help of refresh token 
// If the refresh token stored in database matches the refresh token in the cookie 
// then we will generate the new access token




const refreshAccessToken = asyncHandler(async (req, res) => {
    // Get refresh token from cookies (browser) OR body (mobile/API)
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (!incomingRefreshToken) {
        throw new ApiError(401, "UnAuthorized request - No refresh token");
    }
    try {

        const decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decoded?._id);
        if (!user) throw new ApiError(421, "You are not allowed for refresh token ")
        if (user.refreshToken !== incomingRefreshToken) {
            new ApiError(456, "Refresh Token is expired or used ")
        }

>>>>>>> myrepo/main
        const options = {
            httpOnly: true,
            secure: true
        }
<<<<<<< HEAD
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefereshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
=======


        // Generate new access token 
        const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id)
            return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(new ApiResponse(200,

                {
                    accessToken, refreshToken
                },
                "Access Token refresh successfully "


            ))

    } catch (error) {
        throw new ApiError(404, "Something went wrong in refreshing access token ")
>>>>>>> myrepo/main
    }

})

<<<<<<< HEAD
const changeCurrentPassword = asyncHandler(async(req, res) => {
    const {oldPassword, newPassword} = req.body

    

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))
})


const getCurrentUser = asyncHandler(async(req, res) => {
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        req.user,
        "User fetched successfully"
    ))
})

const updateAccountDetails = asyncHandler(async(req, res) => {
    const {fullName, email} = req.body

    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email: email
            }
        },
        {new: true}
        
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))
});

const updateUserAvatar = asyncHandler(async(req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    //TODO: delete old image - assignment

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")
        
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar image updated successfully")
    )
})

const updateUserCoverImage = asyncHandler(async(req, res) => {
    const coverImageLocalPath = req.file?.path
=======
const changeCurrentPassword = asyncHandler(async (req, res) => {
    try {
        const { newPassword, oldPassword } = req.body;
        // We can also add something like confirm password (optional)
        if (!oldPassword || !newPassword) {
            throw new ApiError(420, "Both old and new password are required");
        }
        // const same = await bcrypt.compare(newPassword, oldPassword)
        // if (same) return new ApiError(415, "New and old Password cannot be same ")
        if (newPassword === oldPassword) {
        throw new ApiError(415, "New and old Password cannot be same")
        }
        // So here the thing , we will use the middleware of auth.middleware.js , in the user.routes
        // soo after this req will have req.user 
        const user = await User.findById(req.user?._id)
        const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
        if (!isPasswordCorrect) {
            throw new ApiError(400, "Invalid old Password ")
        }

        user.password = newPassword
        await user.save({ validateBeforeSave: false })
        // what is happenning here is , we have a pre hook for User schema, where there is save operation it checks 
        // whether the password is entered first time or whether the password is changed , in this cases 
        // User schema encrypts the new password which is plain text using bcrypt and stores it 
        return res.status(200)
            .json(new ApiResponse(200, "Password changed Successfully "))


    } catch (error) {
        throw new ApiError(412, "There was some error while changing the password ")
    }



})

const getcurrentUser = asyncHandler(async (req, res) => {

    const current = req.user

    return res.status(200)
        .json(new ApiResponse(202, current, "You have the current user context "))

})

// This is the method to update the fullname and email  
// We can update anything which we want 

// This will throw error 

// Actually after testing , it is not throwing error 
const updateAccountDetails1 = asyncHandler(async (req, res) => {
    const { fullname, email } = req.body
    if (!fullname || !email) {
        throw new ApiError(400, "All fields are required")
    }
    const user = await User.findByIdAndUpdate(req.user._id,
        { // $set can also be used here 
            fullName: fullname,  // fullName is the field in the database 
            email: email
        },
        { new: true }

    ).select("-password") // This is used to dont include the password in this response 
    return res.status(200)
        .json(new ApiResponse(202, user, "Account Details updated Successfully  "))

});



// Second method to update account details 

const updateAccountDetails2 = asyncHandler(async (req, res) => {
    const { fullname, email } = req.body;
    if (!fullname || !email) {
        throw new ApiError(400, "All fields are required");
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: { fullname, email } },
        { new: true, runValidators: true, select: "-password" } // exclude password
    );

    return res.status(200).json(
        new ApiResponse(200, user, "Account Details updated Successfully")
    );
});


const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarpath = req.file.path;
    const prevAvatar = req.user.avatar; // this is variable of previous avatar in the databsse 

    if (!avatarpath) {
        new ApiError(402, "Avatar not present in the local storage or not given properly  ")
    }
    const avatarcloud = await uploadOnCloudinary(avatarpath);
    if (!avatarcloud.url) {
        throw new ApiError(402, "Error while uploading file on cloudinary ")
    }


    // so the assignment is 
    // as i am updating the user avatar , we will be deleting the old avatar image from cloudinary 


    // This method of getting the publicId from url is chatGpt generated 
    function getPublicIdFromUrl(prevAvatar) {
        const parts = prevAvatar.split("/");
        const fileWithExt = parts.pop(); // e.g. "stlewelcy9ampkfq5tpy.jpg"

        // Check if previous part is a version ("v12345")
        if (parts[parts.length - 1].startsWith("v")) {
            parts.pop(); // remove version
        }

        const publicId = fileWithExt.split(".")[0]; // remove extension
        return parts.slice(parts.indexOf("upload") + 1).join("/") + publicId;
    }

    const publicId = getPublicIdFromUrl(prevAvatar)

    const done = await deletefromCloudinary(publicId);

    if (!done) throw new ApiError(405, "Image Deletion is not done ")


    // Here , I am updating the databse with the new url 
    // I just did, try catch for safety purpose , not needed 
    try {
        const user = await User.findByIdAndUpdate(req.user._id, {

            avatar: avatarcloud.url
        },
            {
                new: true,
            }
        )
            .select("-password")

        return res
            .status(200)
            .json(new ApiResponse(202, user, "The Avatar is updated successfully "))

    }
    catch (error) {
        throw new ApiError(454, "Error While updating the avatar")

    }

})


// When there will be file uploads , have thier end points different

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path
    const prevcoverImage = req.user.coverImage;
>>>>>>> myrepo/main

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing")
    }

<<<<<<< HEAD
    //TODO: delete old image - assignment


=======
>>>>>>> myrepo/main
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on avatar")
<<<<<<< HEAD
        
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover image updated successfully")
    )
})


const getUserChannelProfile = asyncHandler(async(req, res) => {
    const {username} = req.params

    if (!username?.trim()) {
        throw new ApiError(400, "username is missing")
    }

=======

    }



    function getPublicIdFromUrl(prevCoverImage) {
        const parts = prevCoverImage.split("/");
        const fileWithExt = parts.pop(); // e.g. "stlewelcy9ampkfq5tpy.jpg"

        // Check if previous part is a version ("v12345")
        if (parts[parts.length - 1].startsWith("v")) {
            parts.pop(); // remove version
        }

        const publicId = fileWithExt.split(".")[0]; // remove extension
        return parts.slice(parts.indexOf("upload") + 1).join("/") + publicId;
    }

    const publicId = getPublicIdFromUrl(prevcoverImage)
    const done = await deletefromCloudinary(publicId);

    if (!done) throw new ApiError(405, "Image Deletion is not done ")

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Cover image updated successfully")
        )
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params
    if (!username?.trim()) {
        throw new ApiError(402, "username is missing")
    }

    // After agggregation pipelines , the response data is of arrays 
>>>>>>> myrepo/main
    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
<<<<<<< HEAD
=======

>>>>>>> myrepo/main
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
<<<<<<< HEAD
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
=======
                channelSubscribedToCount: {
                    $size: "$subscribedTo"

                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber "] }, // $in looks for the condition in both arrays and object 
>>>>>>> myrepo/main
                        then: true,
                        else: false
                    }
                }
<<<<<<< HEAD
=======


>>>>>>> myrepo/main
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
<<<<<<< HEAD
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1

            }
        }
    ])

    if (!channel?.length) {
        throw new ApiError(404, "channel does not exists")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "User channel fetched successfully")
    )
})

const getWatchHistory = asyncHandler(async(req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
=======
                channelSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                email: 1,
                coverImage: 1,

            }
        }

    ])
    if (channel?.length) throw new ApiError(404, "Channel not found")

    console.log(channel);


    return res.status(200)
        .json(
            new ApiResponse(202, channel[0], "User channel profile fetched successfully ")
        )

})


const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id) // Here the thing we can use to get the actual mongoDb Id (3:21:00 Backend Part 2)
            }

>>>>>>> myrepo/main
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
<<<<<<< HEAD
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first: "$owner"
                            }
                        }
                    }
                ]
=======

>>>>>>> myrepo/main
            }
        }
    ])

<<<<<<< HEAD
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "Watch history fetched successfully"
        )
    )
})


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
=======
})

export {
    registerUser,
    loginUser,
    logOutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getcurrentUser,
    updateAccountDetails1,
>>>>>>> myrepo/main
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}