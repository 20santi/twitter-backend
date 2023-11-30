"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPayment = exports.capturePayment = void 0;
const razorpay_1 = require("../clients/razorpay");
const crypto_1 = require("crypto");
const capturePayment = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const options = {
        amount: 99900,
        currency: "INR",
    };
    try {
        const paymentResponse = yield razorpay_1.instance.orders.create(options);
        return paymentResponse;
    }
    catch (error) {
        console.log("Error during payment: ", error);
        throw new Error("Payment failed");
    }
});
exports.capturePayment = capturePayment;
const verifyPayment = (data) => __awaiter(void 0, void 0, void 0, function* () {
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
    const generated_signature = (0, crypto_1.createHmac)("sha256", process.env.RAZORPAY_SECRET)
        .update(body.toString())
        .digest("hex");
    if (generated_signature == rezorpay_signature) {
    }
});
exports.verifyPayment = verifyPayment;
