import { connect } from "http2";
import { prismaClient } from "../clients/db";
import { redisClient } from "../clients/redis";

interface tweetTypes {
    content: string
    imageURL?: string
    userId: string
}

class TweetService {
    public static async createTweet(data: tweetTypes) {
      const rateLimiting = await redisClient.get(`REDIS-RATELIMITING-TWEET-${data.userId}`);
      const banUser = await redisClient.get(`Ban-User-${data.userId}`);
      if(rateLimiting) {
        throw new Error("You can't tweet rapidly");
      }
      if(banUser) {
        throw new Error("You can not post any tweet");
      }

      const tweet = await prismaClient.tweet.create({
        data: {
          content: data.content,
          imageURL: data?.imageURL,
          author: { connect: { id: data.userId } },
        },
        include: {
          author: true,
        },
      });
      await redisClient.setex(`REDIS-RATELIMITING-TWEET-${data.userId}`, 10, 1);
      await redisClient.del("ALL-TWITTS");
      return tweet;
    }
    public static async deleteTweet(id: string) {
      try{
        await prismaClient.tweet.delete({ where: {id}})
        return true;
      } catch(error) {
        console.log("Error during delete tweet: ", error);
        return false;
      }
    }
    public static async getAllTweets() {
        const cashedValue = await redisClient.get("ALL-TWITTS");
        if(cashedValue) {
            return JSON.parse(cashedValue);
        }
        const tweets = await prismaClient.tweet.findMany({ orderBy: { createAt: "desc" } });
        await redisClient.set("ALL-TWITTS", JSON.stringify(tweets));
        return tweets;
    }
    public static async getUserTweet(userId: string) {
        const tweets = await prismaClient.tweet.findMany({ where: { author: {id: userId}}});
        return tweets;
    }
}

export default TweetService;