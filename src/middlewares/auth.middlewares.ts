import { NextFunction, Request, Response } from "express";
import { IUser, User } from "../models/user.models.ts";
import { ApiError } from "../utils/ApiError.ts";
import { asyncHandler } from "../utils/asyncHandler.ts";
import jwt from "jsonwebtoken";

interface AuthenticatedRequest extends Request {
  user?: IUser;
}

export const verifyJwtToken = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const token: string | undefined =
        req.cookies?.accessToken ||
        req.header("Authorization")?.replace("Bearer ", "");

      if (!token) {
        throw new ApiError(401, "Unauthorized Request");
      }

      const decodedToken: any = jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET as string
      );

      const user: IUser | null = await User.findById(decodedToken?._id)
        .select("-password -refreshToken")
        .lean()
        .exec();

      if (!user) {
        throw new ApiError(401, "Invalid Access Token");
      }

      req.user = user;
      next();
    } catch (error: any) {
      throw new ApiError(401, error?.message || "Invalid Access Token");
    }
  }
);
