<<<<<<< HEAD
const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
    }
}

=======
// This is the first way of the wrapper function 
// This is used for controller 
// Just makes our controller code less repeatitive 
// Higher Order Function 
const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((error) => next(error))
    }

}
>>>>>>> myrepo/main

export { asyncHandler }




<<<<<<< HEAD
// const asyncHandler = () => {}
// const asyncHandler = (func) => () => {}
// const asyncHandler = (func) => async () => {}


// const asyncHandler = (fn) => async (req, res, next) => {
//     try {
//         await fn(req, res, next)
//     } catch (error) {
//         res.status(err.code || 500).json({
//             success: false,
//             message: err.message
//         })
//     }
// }
=======















// Here aysncHandler is a higher order function 
// Examples of Higher order functions are map,filter,forEach etc


// aynscHandler is a wrapper function , which will be useful in many places 
// This wrapper function is using the try catch 



/*
const aysncHandler = (fn) => async(req, res, next) => {
    try {
        await fn(req, res, next)
    } catch (error) {
        res.status(error.code || 500).json({
            success: false,
            message: error.message
        })
    }
}

*/
>>>>>>> myrepo/main
