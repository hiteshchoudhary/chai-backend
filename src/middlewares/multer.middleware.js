import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
      
      cb(null, file.originalname.split(".")[0]+Date.now()+"."+file.originalname.split(".")[1])
    }
  })
  
export const upload = multer({ 
    storage, 
})