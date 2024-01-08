import { ApiError } from "./ApiError.js";
import { MongooseError } from "mongoose";
import { ApiResponse } from "./ApiResponse.js";

const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => {
      if (err instanceof ApiError) {
        return res
          .status(400)
          .json(new ApiResponse(err.statusCode, null, err.message));
      }

      if (err instanceof MongooseError) {
        return res.status(400).json(new ApiResponse(400, null, err.message));
      }

      if (err instanceof Error) {
        return res.status(400).json(new ApiResponse(400, null, err.message));
      }

      return res
        .status(500)
        .json(new ApiResponse(500, null, "Internal Server Error"));
    });
  };
};

export { asyncHandler };

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
