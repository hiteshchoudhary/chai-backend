# Video Streaming Backend

## Description

This backend solution powers a dynamic video streaming application, offering a robust infrastructure and APIs to seamlessly manage video content, user authentication, and engagement features and alot more.

## Features

- **User Authentication:** Secure user authentication and authorization mechanisms.
- **Video CRUD Operations:** Create, Read, Update, and Delete operations for managing video content.
- **Likes:** Allow users to like videos and keep track of liked videos.
- **Comments:** Enable users to add, update, and delete comments on videos.
- **Playlists:** Allow users to create, update, and delete playlists, and add or remove videos from playlists.
- **Subscriptions:** Users can subscribe to channels and view their subscriptions.
- **User Profile:** Get user statistics, videos, and tweets, and update account details.

## Technologies Used

- **Node.js:** JavaScript runtime for server-side development.
- **Express.js:** Web application framework for Node.js.
- **MongoDB:** NoSQL database for storing user data, videos, and likes.
- **Mongoose:** MongoDB object modeling for Node.js.
- **JWT (JSON Web Tokens):** Token-based authentication for securing APIs.
- **RESTful APIs:** Conventional and predictable APIs for easy integration.

## Prerequisites

Before running the application, ensure you have the following installed:

- Node.js and npm
- MongoDB

## Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/your-video-streaming-backend.git

2. **Install dependencies:**
    cd your-video-streaming-backend
    npm install


3. **Configure environment variables:**
    Create a .env file in the project root and set the following variables:

    PORT=8000
    MONGODB_URI=your-mongodb-uri
    CORS_ORIGIN=*
    ACCESS_TOKEN_SECRET=your-access-token
    ACCESS_TOKEN_EXPIRY=1d
    REFRESH_TOKEN_SECRET=your-refresh-token
    REFRESH_TOKEN_EXPIRY=10d
    CLOUDINARY_CLOUD_NAME=cloudinary-name
    CLOUDINARY_API_KEY=cloudinary-api-key
    CLOUDINARY_API_SECRET=cloudinary-api-secret

4. **Run the application:**
    npm start

## API Endpoints
1. **Authentication:**
    POST /api/v1/users/register: Register a new user.
    POST /api/v1/users/login: Log in an existing user.
    POST /api/v1/users/logout: Log out the current user.
    POST /api/v1/users/refresh-token: Refresh access token.
    POST /api/v1/users/change-password: Change the user's current password.
    GET /api/v1/users/current-user: Get details of the currently authenticated user.
    PATCH /api/v1/users/update-account: Update account details of the currently authenticated user.
    PATCH /api/v1/users/avatar: Update user avatar.
    PATCH /api/v1/users/cover-image: Update user cover image.
    GET /api/v1/users/c/:username: Get user channel profile.
    GET /api/v1/users/history: Get watch history of the currently authenticated user.

2. **Videos:**
    GET /api/v1/videos/:videoId: Get a specific video by ID.
    GET /api/v1/videos: Get all videos.
    POST /api/v1/videos: Publish a new video.
    PATCH /api/v1/videos/:videoId: Update video details.
    DELETE /api/v1/videos/:videoId: Delete a video.
    PATCH /api/v1/videos/toggle/publish/:videoId: Toggle publish status of a video.
    GET /api/v1/videos/c/:userId: Get videos of a specific user.

3. **Comments:**
    GET /api/v1/comments/:videoId: Get comments of a specific video.
    POST /api/v1/comments/:videoId: Add a comment to a video.
    PATCH /api/v1/comments/c/:commentId: Update a comment.
    DELETE /api/v1/comments/c/:commentId: Delete a comment.

4. **Likes:**
    POST /api/v1/likes/toggle/v/:videoId: Toggle like on a video.
    GET /api/v1/likes/videos: Get all liked videos.
    POST /api/v1/likes/toggle/c/:commentId: Toggle like on a comment.
    POST /api/v1/likes/toggle/t/:tweetId: Toggle like on a tweet.

5. **Playlists:**
    POST /api/v1/playlist: Create a new playlist.
    GET /api/v1/playlist/:playlistId: Get a specific playlist by ID.
    PATCH /api/v1/playlist/:playlistId: Update playlist details.
    DELETE /api/v1/playlist/:playlistId: Delete a playlist.
    PATCH /api/v1/playlist/add/:videoId/:playlistId: Add a video to a playlist.
    PATCH /api/v1/playlist/remove/:videoId/:playlistId: Remove a video from a playlist.
    GET /api/v1/playlist/user/:userId: Get playlists of a specific user.

6. **Subscriptions:**
    GET /api/v1/subscriptions/c/:channelId: Get subscribed channels of a user.
    POST /api/v1/subscriptions/c/:channelId: Toggle subscription to a channel.
    GET /api/v1/subscriptions/u/:subscriberId: Get subscribers list of a channel.

7. **Dashboard:**
    GET /api/v1/dashboard/stats: Get statistics of the user's channel.
    GET /api/v1/dashboard/videos: Get videos of the user's channel.

8. **Health Check:**
    GET /api/v1/healthcheck: Check the health of the API.

## License
This project is licensed under the Chai aur code channel.
