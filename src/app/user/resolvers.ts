import { User } from "@prisma/client";
import { graphqlContext } from "../../interfaces";
import userService from "../../services/user";
import TweetService from "../../services/tweet";
import { prismaClient } from "../../clients/db";
import { redisClient } from "../../clients/redis";

interface responseType {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  id: string;
}

export const resolvers = {
  Query: {
    verifyGoogleToken: async (parent: any, { token }: { token: string }) => {
      const jwtToken = await userService.verifyGoogleToken(token);
      return jwtToken;
    },
    getCurrentUser: async (parent: any, args: any, ctx: graphqlContext) => {
      if (!ctx) {
        throw new Error("Context is not present");
      }
      const id = ctx?.user?.id;
      if (!id) {
        throw new Error("Id is not present in context");
      }
      const user = await userService.getUserById(id);
      return user;
    },
    getCurrentUserById: async (
      parent: any,
      { id }: { id: string },
      ctx: graphqlContext
    ) => {
      return await userService.getUserById(id);
    },

    capturePayment: async (parent: any, args: any, ctx: graphqlContext) => {
      const result = await userService.capturePayment();
      return result;
    },
  },

  Mutation: {
    followUser: async (
      parent: any,
      { to }: { to: string },
      ctx: graphqlContext
    ) => {
      if (!ctx || !ctx.user) {
        throw new Error("Unauthenticated user");
      }

      const banUser = await redisClient.get(`BAN-USER-${ctx.user.id}`);
      if (banUser) {
        return false;
      }

      await userService.followUser(ctx.user.id, to);
      await redisClient.del(`RECOMMENDED-USER: ${ctx.user.id}`);
      return true;
    },

    unFollowUser: async (
      parent: any,
      { to }: { to: string },
      ctx: graphqlContext
    ) => {
      if (!ctx || !ctx.user) {
        throw new Error("Unauthenticated user");
      }

      const banUser = await redisClient.get(`BAN-USER-${ctx.user.id}`);
      if (banUser) {
        return false;
      }

      await userService.unFollowUser(ctx.user.id, to);
      await redisClient.del(`RECOMMENDED-USER: ${ctx.user.id}`);
      return true;
    },

    banUser: async (
      parent: any,
      { id }: { id: string },
      ctx: graphqlContext
    ) => {
      const result = await userService.banUser(id);
      return result;
    },

    unBanUser: async (
      parent: any,
      { id }: { id: string },
      ctx: graphqlContext
    ) => {
      const result = await userService.unBanUser(id);
      return result;
    },

    verifyPayment: async (
      parent: any,
      { data }: { data: responseType },
      ctx: graphqlContext
    ) => {
      const result = await userService.verifyPayment(data);
      return result;
    },
  },

  extraResolvers: {
    User: {
      tweets: (parent: User) => TweetService.getUserTweet(parent.id),

      likes: async (parent: User) =>
        await prismaClient.like.findMany({
          where: { user: { id: parent.id } },
        }),

      followers: async (parent: User) => {
        const result = await prismaClient.follows.findMany({
          where: { following: { id: parent.id } },
          include: {
            follower: true,
          },
        });
        return result.map((el) => el.follower);
      },

      following: async (parent: User) => {
        const result = await prismaClient.follows.findMany({
          where: { follower: { id: parent.id } },
          include: {
            following: true,
          },
        });
        return result.map((ele) => ele.following);
      },

      recomendedUsers: async (parent: any, args: any, ctx: graphqlContext) => {
        if (!ctx.user) return [];

        const cashedValue = await redisClient.get(
          `RECOMMENDED-USER: ${ctx.user.id}`
        );
        if (cashedValue) {
          return JSON.parse(cashedValue);
        }

        const myFollowings = await prismaClient.follows.findMany({
          where: { follower: { id: ctx.user.id } },
          include: {
            following: {
              include: { followers: { include: { following: true } } },
            },
          },
        });
        const recomendedUser: User[] = [];
        for (const followings of myFollowings) {
          for (const follwingOfFollowedUser of followings.following.followers) {
            if (
              follwingOfFollowedUser.following.id !== ctx.user.id &&
              myFollowings.findIndex(
                (e) => e.followingId === follwingOfFollowedUser.following.id
              ) < 0
            ) {
              recomendedUser.push(follwingOfFollowedUser.following);
            }
          }
        }
        await redisClient.set(
          `RECOMMENDED-USER: ${ctx.user.id}`,
          JSON.stringify(recomendedUser)
        );
        return recomendedUser;
      },
    },
  },
};
