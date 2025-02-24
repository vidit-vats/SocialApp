// const asyncHandler = ()=>{

// }

// const asyncHandler = () => {};
// const asyncHandler = (func) => () => {};
// const asyncHandler = (func) => async () => {};

// err,req,res,next. These 4 properties are given to us.
// 	next deals with the middleware

// ==========Way 1 using try-catch async/await=========
// const asyncHandler = (fn) => async (req, res, next) => {
//   try {
//     await fn(req, res, next);
//   } catch (err) {
//     res.status(err.code || 500).json({
//       success: false,
//       message: err.message,
//     });
//   }
// };

// ===========Way 2 using promises, then/catch=========
const asyncHandler = (requestHandler) => {
	return (req, res, next) => {
		Promise.resolve(requestHandler(req, res, next)).catch((err) =>
			next(err)
		);
	};
};

export { asyncHandler };
