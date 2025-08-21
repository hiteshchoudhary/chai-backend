import ffmpeg from "fluent-ffmpeg";

// Function to get the duration of a video file
// This function takes the path of a video file as input and returns a Promise
// The Promise resolves with the duration of the video (in seconds) or rejects if there's an error
export const getVideoDuration = (videoPath) => {
  return new Promise((resolve, reject) => {
    // ffprobe is a method provided by fluent-ffmpeg to analyze video metadata
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        // If an error occurs, reject the Promise with an error message
        reject("Error extracting video duration");
      } else {
        // If successful, resolve the Promise with the duration of the video
        resolve(metadata.format.duration);
      }
    });
  });
};

/* 
👉 How does FFmpeg help us get the video duration?
   - `ffmpeg.ffprobe(videoPath, callback)` extracts metadata from the video.
   - `metadata.format.duration` gives the total duration of the video in seconds.
   - We wrap this in a Promise to use it asynchronously.

*/
