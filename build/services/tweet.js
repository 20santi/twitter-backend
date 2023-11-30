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
const db_1 = require("../clients/db");
const redis_1 = require("../clients/redis");
class TweetService {
    static createTweet(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const rateLimiting = yield redis_1.redisClient.get(`REDIS-RATELIMITING-TWEET-${data.userId}`);
            const banUser = yield redis_1.redisClient.get(`Ban-User-${data.userId}`);
            if (rateLimiting) {
                throw new Error("You can't tweet rapidly");
            }
            if (banUser) {
                throw new Error("You can not post any tweet");
            }
            const tweet = yield db_1.prismaClient.tweet.create({
                data: {
                    content: data.content,
                    imageURL: data === null || data === void 0 ? void 0 : data.imageURL,
                    author: { connect: { id: data.userId } },
                },
                include: {
                    author: true,
                },
            });
            yield redis_1.redisClient.setex(`REDIS-RATELIMITING-TWEET-${data.userId}`, 10, 1);
            yield redis_1.redisClient.del("ALL-TWITTS");
            return tweet;
        });
    }
    static deleteTweet(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield db_1.prismaClient.tweet.delete({ where: { id } });
                return true;
            }
            catch (error) {
                console.log("Error during delete tweet: ", error);
                return false;
            }
        });
    }
    static getAllTweets() {
        return __awaiter(this, void 0, void 0, function* () {
            const cashedValue = yield redis_1.redisClient.get("ALL-TWITTS");
            if (cashedValue) {
                return JSON.parse(cashedValue);
            }
            const tweets = yield db_1.prismaClient.tweet.findMany({ orderBy: { createAt: "desc" } });
            yield redis_1.redisClient.set("ALL-TWITTS", JSON.stringify(tweets));
            return tweets;
        });
    }
    static getUserTweet(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const tweets = yield db_1.prismaClient.tweet.findMany({ where: { author: { id: userId } } });
            return tweets;
        });
    }
}
exports.default = TweetService;
