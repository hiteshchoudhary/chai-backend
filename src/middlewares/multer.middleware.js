import {randomUUID} from "node:crypto"
import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
      //uuid is required if user need to upload same named video file for thumbnail and video then
      //if won't using unique file name and select same file name for both then the fs.unlink will remove first file and won't get both file for publishing video
      cb(null, `${file.originalname}-${randomUUID()}`);
    }
  })
  
export const upload = multer({ 
    storage, 
})