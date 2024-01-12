# VideoTube Server from chai aur backend

# All TODOs Completed (Added two extra controllers)
- addCommentToTweet for commenting on tweet
- getTweetComments for getting all comments of tweet
> for above two controllers, changes commentModel added one extra field tweet
---

### Welcome to VideoTube Server, the backend for your video streaming application.

## Getting Started

### Prerequisites
1. Make sure you have node installed
   ```bash
   node --version
   ```
This will give you your node version. If not then install node first

2. Setup MongoDB : You can use MongoDB Atlas or any other MongoDB instance.
3. Obtain MongoDB Connection URI.

### Setup Environment Variables

1. Create a `.env` file in the root directory of the project.
2. Open `sample.env` and copy its contents to `.env`.
3. Set values for the environment variables in the `.env` file, including the MongoDB connection URI.

### To Start The Server

Run the following commands in your terminal:

```bash
npm install
npm run dev
```

### Packages used
```json
{
  "devDependencies": {
    "nodemon": "^3.0.1",
    "prettier": "^3.0.3"
  },
  "dependencies": {
    "bcrypt": "^5.1.1",
    "cloudinary": "^1.41.0",
    "cloudinary-build-url": "^0.2.4",
    "cookie-parser": "^1.4.6",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.0.0",
    "mongoose-aggregate-paginate-v2": "^1.0.6",
    "multer": "^1.4.5-lts.1"
  }
}
```

