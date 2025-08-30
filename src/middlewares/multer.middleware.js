import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    const ext = file.originalname.split(".").pop(); // get file extension
    const uniqueName = `${Date.now()}.${ext}`; // use timestamp + extension
    cb(null, uniqueName);
  },
});

export const upload = multer({ storage });
