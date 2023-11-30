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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const db_1 = require("../clients/db");
const jwt_1 = __importDefault(require("./jwt"));
const redis_1 = require("../clients/redis");
const razorpay_1 = require("../clients/razorpay");
const crypto_1 = require("crypto");
class userService {
    static verifyGoogleToken(token) {
        return __awaiter(this, void 0, void 0, function* () {
            const googleOauthURL = new URL("https://oauth2.googleapis.com/tokeninfo");
            googleOauthURL.searchParams.set("id_token", token);
            try {
                const { data } = yield axios_1.default.get(googleOauthURL.toString(), {
                    responseType: "json",
                });
                const user = yield db_1.prismaClient.user.findUnique({
                    where: { email: data.email },
                });
                if (!user) {
                    yield db_1.prismaClient.user.create({
                        data: {
                            firstName: data.given_name,
                            lastName: data === null || data === void 0 ? void 0 : data.family_name,
                            email: data.email,
                            profileImageURL: data === null || data === void 0 ? void 0 : data.picture,
                        },
                    });
                }
                const userInDb = yield db_1.prismaClient.user.findUnique({
                    where: { email: data.email },
                });
                if (!userInDb) {
                    throw new Error("User not find in database");
                }
                const jwtToken = yield jwt_1.default.generateToken(userInDb);
                return jwtToken;
            }
            catch (error) {
                console.error("Axios Error:", error);
            }
        });
    }
    static banUser(id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield db_1.prismaClient.user.update({
                where: {
                    id: id,
                },
                data: {
                    ban: true,
                },
            });
            yield redis_1.redisClient.setex(`BAN-USER-${id}`, 86400, 1);
            return true;
        });
    }
    static unBanUser(id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield db_1.prismaClient.user.update({
                where: {
                    id: id,
                },
                data: {
                    ban: false,
                },
            });
            yield redis_1.redisClient.del(`BAN-USER-${id}`);
            return true;
        });
    }
    static getUserById(id) {
        return db_1.prismaClient.user.findUnique({ where: { id } });
    }
    static followUser(from, to) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield db_1.prismaClient.follows.create({
                data: {
                    follower: { connect: { id: from } },
                    following: { connect: { id: to } },
                },
            });
        });
    }
    static unFollowUser(from, to) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield db_1.prismaClient.follows.delete({
                where: { followerId_followingId: { followerId: from, followingId: to } },
            });
        });
    }
    static capturePayment() {
        return __awaiter(this, void 0, void 0, function* () {
            const options = {
                amount: 99900,
                currency: "INR",
            };
            try {
                const paymentResponse = yield razorpay_1.instance.orders.create(options);
                const response = Object.assign(Object.assign({}, paymentResponse), { razorpay: process.env.RAZORPAY_KEY });
                console.log("Payment response in backend: ", response);
                return response;
            }
            catch (error) {
                console.log("Error during payment: ", error);
                throw new Error("Payment failed");
            }
        });
    }
    static verifyPayment(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const rezorpay_order_id = data.razorpay_order_id;
            const rezorpay_payment_id = data.razorpay_payment_id;
            const rezorpay_signature = data.razorpay_signature;
            console.log("order id:---------------> ", rezorpay_order_id);
            console.log("payment id:--------------> ", rezorpay_payment_id);
            console.log("signature:----------------> ", rezorpay_signature);
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
            console.log("generated signature:------------------> ", generated_signature);
            if (generated_signature === rezorpay_signature) {
                yield db_1.prismaClient.user.update({
                    where: { id: data.id },
                    data: { subscribe: true },
                });
                return true;
            }
        });
    }
}
exports.default = userService;
