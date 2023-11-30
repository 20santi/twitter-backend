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
exports.apolloServer = void 0;
const server_1 = require("@apollo/server");
const express4_1 = require("@apollo/server/express4");
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const user_1 = require("./user");
const cors_1 = __importDefault(require("cors"));
const jwt_1 = __importDefault(require("../services/jwt"));
const twieet_1 = require("./twieet");
const like_1 = require("./like");
function apolloServer() {
    return __awaiter(this, void 0, void 0, function* () {
        const app = (0, express_1.default)();
        app.use(body_parser_1.default.json());
        app.use((0, cors_1.default)());
        const server = new server_1.ApolloServer({
            typeDefs: `
        ${user_1.User.types}
        ${twieet_1.Tweet.types}
        ${like_1.Like.types}
            
        type Query {
          ${user_1.User.queries}
          ${twieet_1.Tweet.queries}
        }
        type Mutation {
          ${twieet_1.Tweet.mutations}
          ${user_1.User.mutations}
          ${like_1.Like.mutations}
        }
    `,
            resolvers: Object.assign(Object.assign(Object.assign({ Query: Object.assign(Object.assign({}, user_1.User.resolvers.Query), twieet_1.Tweet.resolvers.Query), Mutation: Object.assign(Object.assign(Object.assign({}, twieet_1.Tweet.resolvers.Mutation), user_1.User.resolvers.Mutation), like_1.Like.resolvers.Mutation) }, twieet_1.Tweet.resolvers.extraResolvers), user_1.User.resolvers.extraResolvers), like_1.Like.resolvers.extraResolvers),
        });
        yield server.start();
        app.use("/graphql", (0, express4_1.expressMiddleware)(server, {
            context: ({ req, res }) => __awaiter(this, void 0, void 0, function* () {
                return {
                    user: req.headers.authorization
                        ? yield jwt_1.default.decodeToken(req.headers.authorization.split("Bearer ")[1])
                        : undefined,
                };
            }),
        }));
        return app;
    });
}
exports.apolloServer = apolloServer;