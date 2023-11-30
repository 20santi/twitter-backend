import { prismaClient } from "../../clients/db";
import { graphqlContext } from "../../interfaces";
import { Tweet } from "@prisma/client";
import userService from "../../services/user";
import TweetService from "../../services/tweet";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { redisClient } from "../../clients/redis";

interface tweetTypes {
  content: string;
  imageURL?: string;
}

const s3Client = new S3Client({
  region: "ap-south-1",
  credentials: {
    accessKeyId: "AKIAXR7KDA73NKASSZ7S",
    secretAccessKey: "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",
  },
});

export const resolvers = {
  Mutation: {
    createTweet: async (
      parent: any,
      { payload }: { payload: tweetTypes },
      ctx: graphqlContext
    ) => {
      if (!ctx.user) {
        throw new Error("User is not authenticated");
      }
      const tweet = await TweetService.createTweet({
        ...payload,
        userId: ctx.user.id,
      });
      return tweet;
    },
    deleteTweet: async (
      parent: any,
      { id }: { id: string },
      ctx: graphqlContext
    ) => {
      const result = await TweetService.deleteTweet(id);
      if (result) {
        await redisClient.del("ALL-TWITTS");
      }
      return result;
    },
  },

  Query: {
    getAllTweets: async () => {
      const tweets = await TweetService.getAllTweets();
      return tweets;
    },
    getSignedURLForTweet: async (
      parent: any,
      { imageType, imageName }: { imageType: string; imageName: string },
      ctx: graphqlContext
    ) => {
      if (!ctx || !ctx.user) throw new Error("Unauthenticated");

      const allowedIamgeTypes = ["png", "webp", "jpg", "jpeg"];
      if (!allowedIamgeTypes.includes(imageType))
        throw new Error("Image type not supported");

      const putObjectComand = new PutObjectCommand({
        Bucket: "santi-own-twitter-dev",
        Key: `uploads/${imageName}-${Date.now()}.${imageType}`,
      });

      const signedUrl = await getSignedUrl(s3Client, putObjectComand);
      return signedUrl;
    },
  },

  extraResolvers: {
    Tweet: {
      author: (parent: Tweet) => userService.getUserById(parent.authorId),

      likes: async(parent: Tweet) => await prismaClient.like.findMany({
        where: { tweet: { id: parent.id }}
      }) 
    },
  },
};
