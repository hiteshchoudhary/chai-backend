import mongoose, {isValidObjectId} from "mongoose"
import {Comment} from "../models/comment.model.js"
import {Video} from "../models/video.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

/**
 * Comment Controller - Handles all comment-related operations
 * 
 * This controller manages comments on videos including:
 * - Fetching comments with pagination
 * - Adding new comments
 * - Updating existing comments
 * - Deleting comments
 */

/**
 * getVideoComments - Get all comments for a specific video
 * 
 * Features:
 * - Pagination support (page, limit)
 * - Returns comments with owner details
 * - Sorted by newest first
 * - Validates video exists
 * 
 * Process:
 * 1. Validate videoId
 * 2. Check if video exists
 * 3. Fetch comments with pagination
 * 4. Populate owner information
 * 5. Return paginated comments
 */
const getVideoComments = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    // Validate videoId
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    // Check if video exists
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    // Pagination options
    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { createdAt: -1 } // Newest comments first
    }

    // Aggregate pipeline to get comments with owner details
    const comments = await Comment.aggregatePaginate(
        Comment.aggregate([
            {
                $match: {
                    video: new mongoose.Types.ObjectId(videoId)
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner",
                    pipeline: [
                        {
                            $project: {
                                username: 1,
                                fullName: 1,
                                avatar: 1
                            }
                        }
                    ]
                }
            },
            {
                $addFields: {
                    owner: {
                        $first: "$owner"
                    }
                }
            },
            {
                $sort: { createdAt: -1 }
            }
        ]),
        options
    )

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                comments,
                "Comments fetched successfully"
            )
        )
})

/**
 * addComment - Add a new comment to a video
 * 
 * Features:
 * - Validates video exists
 * - Requires content (comment text)
 * - Associates comment with video and owner
 * 
 * Process:
 * 1. Validate videoId
 * 2. Check if video exists
 * 3. Validate comment content
 * 4. Create comment document
 * 5. Return created comment with owner details
 * 
 * Required Body:
 * - content: Comment text content
 */
const addComment = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const {content} = req.body

    // Validate videoId
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    // Check if video exists
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    // Validate comment content
    if (!content || content.trim() === "") {
        throw new ApiError(400, "Comment content is required")
    }

    // Create comment
    const comment = await Comment.create({
        content: content.trim(),
        video: videoId,
        owner: req.user._id
    })

    // Fetch comment with owner details
    const createdComment = await Comment.findById(comment._id).populate(
        "owner",
        "username fullName avatar"
    )

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                createdComment,
                "Comment added successfully"
            )
        )
})

/**
 * updateComment - Update an existing comment
 * 
 * Features:
 * - Only comment owner can update
 * - Validates comment ownership
 * - Updates comment content
 * 
 * Process:
 * 1. Validate commentId
 * 2. Check if comment exists
 * 3. Verify user is the owner
 * 4. Validate new content
 * 5. Update comment
 * 6. Return updated comment
 * 
 * Required Body:
 * - content: Updated comment text
 */
const updateComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    const {content} = req.body

    // Validate commentId
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID")
    }

    // Find comment
    const comment = await Comment.findById(commentId)
    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }

    // Check if user is the owner
    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can only update your own comments")
    }

    // Validate content
    if (!content || content.trim() === "") {
        throw new ApiError(400, "Comment content is required")
    }

    // Update comment
    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set: {
                content: content.trim()
            }
        },
        {
            new: true
        }
    ).populate("owner", "username fullName avatar")

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedComment,
                "Comment updated successfully"
            )
        )
})

/**
 * deleteComment - Delete a comment
 * 
 * Features:
 * - Only comment owner can delete
 * - Validates comment ownership
 * 
 * Process:
 * 1. Validate commentId
 * 2. Check if comment exists
 * 3. Verify user is the owner
 * 4. Delete comment
 * 5. Return success response
 */
const deleteComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params

    // Validate commentId
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID")
    }

    // Find comment
    const comment = await Comment.findById(commentId)
    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }

    // Check if user is the owner
    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can only delete your own comments")
    }

    // Delete comment
    await Comment.findByIdAndDelete(commentId)

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Comment deleted successfully"
            )
        )
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }
