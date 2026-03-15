///This function is a wrapper for handling errors in async functions in Express. It eliminates the need to write try/catch statements in each controller.

const asyncHandler = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

module.exports = { asyncHandler };
