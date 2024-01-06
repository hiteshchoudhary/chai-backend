import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
      
      cb(null, "chai_" + Math.floor((Math.random() * 100) + 1) + file.originalname)
    }
  })
  
export const upload = multer({ 
    storage, 
})
