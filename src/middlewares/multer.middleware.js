import multer from "multer";

/*
  - Multer is a middleware used for handling file uploads in Node.js.
  - Here, we configure it to store files temporarily on the server.
*/

const storage = multer.diskStorage({
  /*
       `destination`: Where to store uploaded files
      - This function takes `req`, `file`, and a callback `cb`.
      - `cb(null, "./public/temp")` tells Multer to save files in the "public/temp" directory.
    */
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },

  /*
        `filename`: How to name the uploaded file
      - This function generates the filename for the uploaded file.
      - `file.originalname` keeps the original file name instead of renaming it.
    */
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

/*
     Setting Up Multer Upload
    - `multer({ storage })` initializes Multer with our custom storage options.
    - We can later use `upload.single("fileFieldName")` in our routes to handle single-file uploads.
  */
export const upload = multer({
  storage,
});

/*
 Multer Storage System - Notes: 

  👉 Why use `multer.diskStorage()` instead of default storage?
     - Default storage saves files in memory (RAM), which is temporary.
     - Disk storage keeps files in a specific directory, making them persist longer.

  👉 Why use `file.originalname`?
     - It keeps the original filename, making it recognizable for users.
     - If you want unique names, consider appending `Date.now()` to the filename.

*/
