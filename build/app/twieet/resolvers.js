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
exports.resolvers = void 0;
const db_1 = require("../../clients/db");
const user_1 = __importDefault(require("../../services/user"));
const tweet_1 = __importDefault(require("../../services/tweet"));
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const redis_1 = require("../../clients/redis");
const s3Client = new client_s3_1.S3Client({
    region: "ap-south-1",
    credentials: {
        accessKeyId: "AKIAXR7KDA73NKASSZ7S",
        secretAccessKey: "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",
    },
});
exports.resolvers = {
    Mutation: {
        createTweet: (parent, { payload }, ctx) => __awaiter(void 0, void 0, void 0, function* () {
            if (!ctx.user) {
                throw new Error("User is not authenticated");
            }
            const tweet = yield tweet_1.default.createTweet(Object.assign(Object.assign({}, payload), { userId: ctx.user.id }));
            return tweet;
        }),
        deleteTweet: (parent, { id }, ctx) => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield tweet_1.default.deleteTweet(id);
            if (result) {
                yield redis_1.redisClient.del("ALL-TWITTS");
            }
            return result;
        }),
    },
    Query: {
        getAllTweets: () => __awaiter(void 0, void 0, void 0, function* () {
            const tweets = yield tweet_1.default.getAllTweets();
            return tweets;
        }),
        getSignedURLForTweet: (parent, { imageType, imageName }, ctx) => __awaiter(void 0, void 0, void 0, function* () {
            if (!ctx || !ctx.user)
                throw new Error("Unauthenticated");
            const allowedIamgeTypes = ["png", "webp", "jpg", "jpeg"];
            if (!allowedIamgeTypes.includes(imageType))
                throw new Error("Image type not supported");
            const putObjectComand = new client_s3_1.PutObjectCommand({
                Bucket: "santi-own-twitter-dev",
                Key: `uploads/${imageName}-${Date.now()}.${imageType}`,
            });
            const signedUrl = yield (0, s3_request_presigner_1.getSignedUrl)(s3Client, putObjectComand);
            return signedUrl;
        }),
    },
    extraResolvers: {
        Tweet: {
            author: (parent) => user_1.default.getUserById(parent.authorId),
            likes: (parent) => __awaiter(void 0, void 0, void 0, function* () {
                return yield db_1.prismaClient.like.findMany({
                    where: { tweet: { id: parent.id } }
                });
            })
        },
    },
};
