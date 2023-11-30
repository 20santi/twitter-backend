import Razorpay from "razorpay";

interface instanceType {
    key_id: string;
    key_secret: string;
}

const razorpayConfig: instanceType = {
    key_id: process.env.RAZORPAY_KEY || "",
    key_secret: process.env.RAZORPAY_SECRET || ""
};

export const instance = new Razorpay(razorpayConfig);
