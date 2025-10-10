<<<<<<< HEAD
import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
      
      cb(null, file.originalname)
    }
  })
  
export const upload = multer({ 
    storage, 
})
=======
// Will be used for file uploads 
import multer from "multer"


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
        // So this file.originalname is the name by which user has uploaded the file 
        // You can add more security to it , 7:39:10
        // This is simple but not always secure, since two users uploading files with the same name could overwrite each other’s files.
        // That’s why many apps use Date.now() or UUIDs to generate unique names
        cb(null, file.originalname)
    }
})
// This storage method returns the file Name 
export const upload = multer({
    storage
})



// The complete flow of file uploads in this project 

/*
Frontend → sends file via form/API
Multer → saves file locally (public/temp/avatar-123.jpg)
Your Controller → calls uploadOnCloudinary(req.file.path)
Cloudinary → uploads file to cloud, returns URL
Cleanup → local file deleted via fs.unlinkSync()
Database → save Cloudinary URL in user profile


*/


// This is achieved using two files multer.middleware.js and cloudinary.js 
>>>>>>> myrepo/main
