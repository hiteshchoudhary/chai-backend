import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const healthcheck = asyncHandler(async (req, res) => {
  //TODO: build a healthcheck response that simply returns the OK status as json with a message

  try {
    const isHealthy = true;

    if (!isHealthy) {
      throw new ApiError(500, "Something went wrong during health check.");
    }

    res.status(200).json(new ApiResponse(true, null, "Server is running OK"));
  } catch (error) {
    throw new ApiError(
      500,
      error.message || "An error occurred during the health check."
    );
  }
});

export { healthcheck };
