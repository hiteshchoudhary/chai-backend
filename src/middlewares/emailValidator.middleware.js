import axios from "axios";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import dotenv from "dotenv";
dotenv.config();

const ABSTRACT_API_KEY = process.env.ABSTRACT_API_KEY;

//middleware to validate email using Abstract API
export const emailValidator = asyncHandler(async (req, res, next) => {
  // console.log("Inside emailValidator middleware", req.body);

  const { email } = req.body;
  if (!email) {
    throw new ApiError(400, "Email is required");
  }
  //call Abstract API to validate email
  const response = await axios.get(
    `https://emailreputation.abstractapi.com/v1/?api_key=${ABSTRACT_API_KEY}&email=${email}`
  );

  const data = response.data;
  // console.log("Email validation response:", data);

  if (data.email_deliverability.status !== "DELIVERABLE") {
    throw new ApiError(400, "Invalid email address");
  }
  next();
});
