import mongoose from "mongoose";
import { Movie } from "../models/movie.model.js"; 
import { ApiError } from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.model.js";
const movie = asyncHandler(async (req,res) => {
    return res.json(new ApiResponse(200, {}, "movie rote health check"))
})

const getAllMovies = asyncHandler(async (req,res) => {
  const { page = 1, limit = 10 } = req.query;
  // 2. Query movies owned by that user
  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    populate: { path: "owner", select: "username fullName email" }
  };

  const movies = await Movie.aggregatePaginate({ owner: req.author._id }, options);

  if (!movies.docs || movies.docs.length === 0) {
    throw new ApiError(404, "No movies found for this user");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, movies, "Fetched all movies success"));
});


const publishAMovie = asyncHandler(async (req,res) => {
    const { title, description, price} = req.body
        console.log(title, description);
        
        if (!title || !description || !price) {
            throw new ApiError(400, "title and price,description must feild")
        }
    
        const movieLocalPath = req.files?.movieUrl[0]?.path
        const movieThumbnailLocalPath = req.files?.movieThumbnail[0]?.path
    
        const movie = await uploadOnCloudinary(movieLocalPath)
        const movieThumbnail = await uploadOnCloudinary(
          movieThumbnailLocalPath
        );
    
        if (!movie && !movieThumbnail) {
            throw new ApiError(400, "something went wrong while uploading on cludinary")
        }
    
        const videoCreation = await Movie.create({
            movieUrl: movie.url,
            title,
            description,
            movieThumbnail: movieThumbnail.url,
            owner: req.author._id,
            price,
        })
    
        if (!videoCreation) {
            throw new ApiError(400, "something went wrong while vide creation") 
        }
    
        return res.status(200).json(
            new ApiResponse(200, videoCreation, "video created success")
        )

})

const getMovieById = asyncHandler(async (req,res) => {
    const { movieId } = req.params
    if (!movieId) {
        throw new ApiError(400, "movieId is not there")
    }
    const getMovieById = await Movie.findById( movieId );
    if (!movieId) {
        throw new ApiError(400, "movie not found")
    }
    return res.status(200).json(
        new ApiResponse(200, getMovieById, "movie fetched success")
    )
})

const updateMovie = asyncHandler(async (req,res) => {
    const { movieId } = req.params
    const {title, description, price, movieThumbnail} = req.body

    if (!title && !description && !price && !movieThumbnail) {
        throw new ApiError(400, "select atleast one feild to update")
    }

    if (!movieId) {
        throw new ApiError(400, "movieId is not there")
    }
    const movie = await Movie.findByIdAndUpdate(movieId,
        { 
        title,
        description,
        price,
        movieThumbnail
        }
    )
    return res.status(200).json(new ApiResponse(200, movie, "update success"))

})

const deleteMovie = asyncHandler(async (req,res) => {
    const { movieId } = req.params

    const movie = await Movie.findByIdAndDelete(movieId)

    return res.status(200).json(new ApiResponse(200, movie, "deletion success"))
})

const togglePublishStatus = asyncHandler(async (req,res) => {
    const { movieId } = req.params

    const existingmovie = await Movie.findById(movieId)

    if (existingmovie) {
        await Movie.findByIdAndUpdate(movieId, {isPublished: true}, {new: true})
    }
    else {
        throw new ApiError(400, "movie not found")
    }

    return res.status(200).json(new ApiResponse(200, existingmovie, "toggle publish status success"))
})

const getMovieViews = asyncHandler(async (req,res) => {
  const {movieId} = req.params
  if (!movieId) {
    throw new ApiError(400, "MovieId is not there")
  }
  const movie = await Movie.findById(videoId)
  if (!movie) {
    throw new ApiError(400, "something went wrong while getting movie views")
  }
  movie.views += 1
  await movie.save()
  return res.status(200).json(new ApiResponse(200, movie, "fetched movie views"))
})

export{
    movie,
    publishAMovie,
    getAllMovies,
    getMovieById,
    updateMovie,
    deleteMovie,
    togglePublishStatus,
    getMovieViews,
}