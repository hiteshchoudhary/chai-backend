/*
  Normally, if an async function throws an error, we'd need a try-catch block.
  But asyncHandler simplifies this by catching errors for us and passing them to Express's error handler.
*/

const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    // Wrapping the async function in a Promise
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err)); // If an error happens, it gets passed to Express error handling middleware
  };
};

/*
   👉 Why do we need asyncHandler?
     - Express expects error-handling middleware to be explicitly called using `next(err)`. Without this, uncaught async errors will crash the server. 
     - Instead of wrapping every async function in try-catch, asyncHandler does it for us! 
  
  👉 How does Promise.resolve() work?
     - It ensures that if `requestHandler` is an async function that returns a Promise, we handle both success and failure properly.
     - If the function resolves, all good! 
     - If the function rejects (throws an error), `.catch()` will send it to `next(err)`, so Express can deal with it.
  
*/
