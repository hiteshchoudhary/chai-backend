import { Router } from "express";
import { 
    movie,
    publishAMovie,
    getAllMovies,
    getMovieById,
    updateMovie,
    deleteMovie,
    togglePublishStatus,
    getMovieViews,
} from "../controllers/movie.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/roleCheck.middleware.js";


const router = Router()

router.use(verifyJWT, authorizeRoles("admin"))

router
.route("/healthCheck")
.get(movie)
router
.route("/")
.get(getAllMovies)
.post(
        upload.fields([
            {
                name: "movieUrl",
                maxCount: 1,
            },
            {
                name: "movieThumbnail",
                maxCount: 1,
            },
            
        ]),
    publishAMovie
);

router
.route("/:movieId")
.get(getMovieById)
.patch(upload.single("movieThumbnail"),updateMovie)
.delete(deleteMovie)
.post(togglePublishStatus)

router
.route("/views/:movieId")
.get(getMovieViews)


export default router

