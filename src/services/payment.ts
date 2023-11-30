import { instance } from "../clients/razorpay";
import { createHmac } from "crypto";

interface dataTypes {
  rezorpay_order_id: string;
  rezorpay_payment_id: string;
  rezorpay_signature: string;
}

export const capturePayment = async (id: string) => {
  const options = {
    amount: 99900,
    currency: "INR",
  };

  try {
    const paymentResponse = await instance.orders.create(options);
    return paymentResponse;
  } catch (error) {
    console.log("Error during payment: ", error);
    throw new Error("Payment failed");
  }
};

export const verifyPayment = async (data: dataTypes) => {
  const rezorpay_order_id = data.rezorpay_order_id;
  const rezorpay_payment_id = data.rezorpay_payment_id;
  const rezorpay_signature = data.rezorpay_signature;

  if (!rezorpay_order_id || !rezorpay_payment_id || !rezorpay_signature) {
    throw new Error("Payment failed");
  }
  const body = rezorpay_order_id + "|" + rezorpay_payment_id;
  if (!process.env.RAZORPAY_SECRET) {
    throw new Error("Razoepay Secret key is not present");
  }
  const generated_signature = createHmac("sha256", process.env.RAZORPAY_SECRET)
    .update(body.toString())
    .digest("hex");
  if (generated_signature == rezorpay_signature) {
    
  }
};
