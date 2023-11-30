import { Like } from "@prisma/client";
import { graphqlContext } from "../../interfaces";
import LikeService from "../../services/like";
import { prismaClient } from "../../clients/db";

export const resolvers = {
    Mutation: {
        likeTweet: async (
            parent: any,
            { id }: { id: string },
            ctx: graphqlContext
          ) => {
            if(!ctx.user) {
              throw new Error("User id is not present");
            }
            const result = await LikeService.likeTweet(ctx.user?.id, id);
            return result;
          },
    },

    extraResolvers: {
        Like: {
            user: async (parent: Like) => {
                return await prismaClient.user.findUnique({ where: { id: parent.userId } })
            },
            tweet: async (parent: Like) => {
                return await prismaClient.tweet.findUnique({ where: { id: parent.tweetId } })
            }
        }
    }
}