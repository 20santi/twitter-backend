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
const user_1 = __importDefault(require("../../services/user"));
const tweet_1 = __importDefault(require("../../services/tweet"));
const db_1 = require("../../clients/db");
const redis_1 = require("../../clients/redis");
exports.resolvers = {
    Query: {
        verifyGoogleToken: (parent, { token }) => __awaiter(void 0, void 0, void 0, function* () {
            const jwtToken = yield user_1.default.verifyGoogleToken(token);
            return jwtToken;
        }),
        getCurrentUser: (parent, args, ctx) => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            if (!ctx) {
                throw new Error("Context is not present");
            }
            const id = (_a = ctx === null || ctx === void 0 ? void 0 : ctx.user) === null || _a === void 0 ? void 0 : _a.id;
            if (!id) {
                throw new Error("Id is not present in context");
            }
            const user = yield user_1.default.getUserById(id);
            return user;
        }),
        getCurrentUserById: (parent, { id }, ctx) => __awaiter(void 0, void 0, void 0, function* () {
            return yield user_1.default.getUserById(id);
        }),
        capturePayment: (parent, args, ctx) => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield user_1.default.capturePayment();
            return result;
        }),
    },
    Mutation: {
        followUser: (parent, { to }, ctx) => __awaiter(void 0, void 0, void 0, function* () {
            if (!ctx || !ctx.user) {
                throw new Error("Unauthenticated user");
            }
            const banUser = yield redis_1.redisClient.get(`BAN-USER-${ctx.user.id}`);
            if (banUser) {
                return false;
            }
            yield user_1.default.followUser(ctx.user.id, to);
            yield redis_1.redisClient.del(`RECOMMENDED-USER: ${ctx.user.id}`);
            return true;
        }),
        unFollowUser: (parent, { to }, ctx) => __awaiter(void 0, void 0, void 0, function* () {
            if (!ctx || !ctx.user) {
                throw new Error("Unauthenticated user");
            }
            const banUser = yield redis_1.redisClient.get(`BAN-USER-${ctx.user.id}`);
            if (banUser) {
                return false;
            }
            yield user_1.default.unFollowUser(ctx.user.id, to);
            yield redis_1.redisClient.del(`RECOMMENDED-USER: ${ctx.user.id}`);
            return true;
        }),
        banUser: (parent, { id }, ctx) => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield user_1.default.banUser(id);
            return result;
        }),
        unBanUser: (parent, { id }, ctx) => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield user_1.default.unBanUser(id);
            return result;
        }),
        verifyPayment: (parent, { data }, ctx) => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield user_1.default.verifyPayment(data);
            return result;
        }),
    },
    extraResolvers: {
        User: {
            tweets: (parent) => tweet_1.default.getUserTweet(parent.id),
            likes: (parent) => __awaiter(void 0, void 0, void 0, function* () {
                return yield db_1.prismaClient.like.findMany({
                    where: { user: { id: parent.id } },
                });
            }),
            followers: (parent) => __awaiter(void 0, void 0, void 0, function* () {
                const result = yield db_1.prismaClient.follows.findMany({
                    where: { following: { id: parent.id } },
                    include: {
                        follower: true,
                    },
                });
                return result.map((el) => el.follower);
            }),
            following: (parent) => __awaiter(void 0, void 0, void 0, function* () {
                const result = yield db_1.prismaClient.follows.findMany({
                    where: { follower: { id: parent.id } },
                    include: {
                        following: true,
                    },
                });
                return result.map((ele) => ele.following);
            }),
            recomendedUsers: (parent, args, ctx) => __awaiter(void 0, void 0, void 0, function* () {
                if (!ctx.user)
                    return [];
                const cashedValue = yield redis_1.redisClient.get(`RECOMMENDED-USER: ${ctx.user.id}`);
                if (cashedValue) {
                    return JSON.parse(cashedValue);
                }
                const myFollowings = yield db_1.prismaClient.follows.findMany({
                    where: { follower: { id: ctx.user.id } },
                    include: {
                        following: {
                            include: { followers: { include: { following: true } } },
                        },
                    },
                });
                const recomendedUser = [];
                for (const followings of myFollowings) {
                    for (const follwingOfFollowedUser of followings.following.followers) {
                        if (follwingOfFollowedUser.following.id !== ctx.user.id &&
                            myFollowings.findIndex((e) => e.followingId === follwingOfFollowedUser.following.id) < 0) {
                            recomendedUser.push(follwingOfFollowedUser.following);
                        }
                    }
                }
                yield redis_1.redisClient.set(`RECOMMENDED-USER: ${ctx.user.id}`, JSON.stringify(recomendedUser));
                return recomendedUser;
            }),
        },
    },
};
