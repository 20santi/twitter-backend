import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import express from "express";
import bodyParser from "body-parser";
import { User } from "./user";
import cors from "cors";
import jwtService from "../services/jwt";
import { graphqlContext } from "../interfaces";
import { Tweet } from "./twieet";
import { Like } from "./like";

export async function apolloServer() {
  const app = express();
  app.use(bodyParser.json());
  app.use(cors());

  const server = new ApolloServer<graphqlContext>({
    typeDefs: `
        ${User.types}
        ${Tweet.types}
        ${Like.types}
            
        type Query {
          ${User.queries}
          ${Tweet.queries}
        }
        type Mutation {
          ${Tweet.mutations}
          ${User.mutations}
          ${Like.mutations}
        }
    `,
    resolvers: {
      Query: {
        ...User.resolvers.Query,
        ...Tweet.resolvers.Query
      },
      Mutation: {
        ...Tweet.resolvers.Mutation,
        ...User.resolvers.Mutation,
        ...Like.resolvers.Mutation
      },
      ...Tweet.resolvers.extraResolvers,
      ...User.resolvers.extraResolvers,
      ...Like.resolvers.extraResolvers
    },
  });

  await server.start();

  app.use(
    "/graphql",
    expressMiddleware(server, {
      context: async ({ req, res }) => {
        return {
          user: req.headers.authorization
            ? await jwtService.decodeToken(
                req.headers.authorization.split("Bearer ")[1]
              )
            : undefined,
        };
      },
    })
  );

  return app;
}
