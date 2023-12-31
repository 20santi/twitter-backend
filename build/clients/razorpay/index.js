"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.instance = void 0;
const razorpay_1 = __importDefault(require("razorpay"));
const razorpayConfig = {
    key_id: process.env.RAZORPAY_KEY || "",
    key_secret: process.env.RAZORPAY_SECRET || ""
};
exports.instance = new razorpay_1.default(razorpayConfig);
