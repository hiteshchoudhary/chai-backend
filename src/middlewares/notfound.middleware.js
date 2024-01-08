import { ApiError } from "../utils/ApiError.js";

const unknownEndpoint = (_req, _res) => {
  throw new ApiError("404", "The following endpoint is not found !");
};

export { unknownEndpoint };
