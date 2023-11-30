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
const like_1 = __importDefault(require("../../services/like"));
const db_1 = require("../../clients/db");
exports.resolvers = {
    Mutation: {
        likeTweet: (parent, { id }, ctx) => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            if (!ctx.user) {
                throw new Error("User id is not present");
            }
            const result = yield like_1.default.likeTweet((_a = ctx.user) === null || _a === void 0 ? void 0 : _a.id, id);
            return result;
        }),
    },
    extraResolvers: {
        Like: {
            user: (parent) => __awaiter(void 0, void 0, void 0, function* () {
                return yield db_1.prismaClient.user.findUnique({ where: { id: parent.userId } });
            }),
            tweet: (parent) => __awaiter(void 0, void 0, void 0, function* () {
                return yield db_1.prismaClient.tweet.findUnique({ where: { id: parent.tweetId } });
            })
        }
    }
};
