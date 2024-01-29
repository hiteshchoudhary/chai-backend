# Youtube Backend In Nodejs 

ASSIGNMENT DONE FULLY WORKING  WITH ALL POSSIBLE EDGE CASES !!!!

We are building a complete video hosting website similar to youtube with all the features like login, signup, upload video, like, dislike, comment, reply, subscribe, unsubscribe, and many more.

Check the links to understand
- [Model link](https://app.eraser.io/workspace/YtPqZ1VogxGy1jzIDkzj?origin=share)
- [Posman Collection](https://api.postman.com/collections/29213528-b18cbb6f-1d38-4abd-afad-648f764c8fdc?access_key=PMAT-01HN8QSSTMSNAJY156EWCH6HEQ)
# Summary of this project

This project is a complex backend project that is built with nodejs, expressjs, mongodb, mongoose, jwt, bcrypt, and many more. This project is a complete backend project that has all the features that a backend project should have.
Project uses all standard practices like JWT, bcrypt, access tokens, refresh Tokens and many more. We have spent a lot of time in building this project and we are sure that you will learn a lot from this project.

--- 
# Getting Started
Prerequisite
---
- [Node](https://nodejs.org/en/download/current)
- [NodeMon](https://www.npmjs.com/package/nodemon)
```
$npm install -g nodemon

# or using yarn:
$yarn global add nodemon
```
- dotenv
```
$npm i dotenv
```
Run Locally
---
- check npm
```
$npm -v
```
- check nodemon
```
$nodemon -v
```
- install all the node_modules
```
$npm install
```
- create a .env file 
```
chai-backend/
│
├──node_modules/
├── public/
│   ├── temp/
│        └── .gitkeep
│
├── src/
│   ├── controllers/
│   │   ├── user.controller.js
│   │   ├── video.controller.js
│   │   └── ...
│   │
│   ├── models/
│   │   ├── user.model.js
│   │   ├── video.model.js
│   │   └── ...
│   ├── db/
|   |   └──index.js
|   |
│   ├── routes/
│   │   ├── user.routes.js
│   │   ├── playlist.routes.js
│   │   └── ...
│   │
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── multer.middleware.js
│   │   └── ...
│   │
│   ├── utils/
│   │   ├── cloudinary.js
│   │   ├── ApiError.js
│   │   └── ...
│   │
│   ├── app.js
│   ├── constant.js
│   └── index.js
├── .env      #add .env files to add environment variables 
├── .gitignore
├── .prettierignore
├── .prettierrc
├── package.json
├── package-lock.json
└── README.md


```
- create the [cloudinary](https://cloudinary.com/users/register_free) account(free version)
- get the cloudinary credential

![cloudinary console screenshot](https://res.cloudinary.com/dcj4tcmrn/image/upload/v1706549157/i6kgnld7kk11tiepdscv.png)

in the .env file

```
PORT=8000
MONGODB_URI="Your mongodb URI string"
CORS_ORIGIN=*
ACCESS_TOKEN_SECRET="yours secret key"
ACCESS_TOKEN_EXPIRY="yours secret key"
REFRESH_TOKEN_SECRET="yours secret key"
REFRESH_TOKEN_EXPIRY="yours secret key"

CLOUDINARY_CLOUD_NAME="your cloud name"
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```
- run the server
```
$npm run dev
```
Any problem you can contact [me](https://twitter.com/Dipeshxdev) 

---

# Wanna Learn Production Level backend
Hitesh Sir's video
- [Video playlist](https://www.youtube.com/watch?v=EH3vGeqeIAo&list=PLu71SKxNbfoBGh_8p_NS-ZAh6v7HhYqHW)

  [OG Goat](https://www.youtube.com/@chaiaurcode)
---