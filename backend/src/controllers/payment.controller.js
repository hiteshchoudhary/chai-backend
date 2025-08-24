import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import instance from "../utils/payment.js"
const checkout = asyncHandler(async (req,res) => {
        const options = {
          amount: Number(req.body.amount) * 100, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
          currency: "INR",
        };
            const order = await instance.orders.create(options)
            console.log(order);
    return res.status(200).json(new ApiResponse(200, { order }));
})

import crypto from "crypto";
import { Payment } from "../models/payment.model.js";
import { User } from "../models/user.model.js";

const paymentVerification = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, movieId } = req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");

  const isAuthentic = expectedSignature === razorpay_signature;

  if (!isAuthentic) {
    return res.status(400).json(new ApiError(400, "Payment verification failed"));
  }


  await Payment.create({
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  });

  // ✅ Update user's purchased movies
  await User.findByIdAndUpdate(
    req.user._id, 
    { $addToSet: { purchasedMovies: movieId } }, 
    { new: true }
  );

  return res.redirect(
    `http://localhost:5147/paymentsuccess?reference=${razorpay_payment_id}`
  );
});


export {checkout,paymentVerification}