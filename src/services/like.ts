import { prismaClient } from "../clients/db";

class LikeService {
    public static async likeTweet(userId: string, tweetId: string) {
        await prismaClient.like.create({
          data: {
            user: { connect: { id: userId } },
            tweet: { connect: { id: tweetId } }
          }
        })
        return true;
      }
}

export default LikeService;