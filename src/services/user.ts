import axios from "axios";
import { prismaClient } from "../clients/db";
import jwtService from "./jwt";
import { redisClient } from "../clients/redis";
import { instance } from "../clients/razorpay";
import { createHmac } from "crypto";

interface googleOauthTokenTypes {
  iss?: string;
  azp?: string;
  aud?: string;
  sub?: string;
  email: string;
  email_verified: string;
  nbf?: string;
  name?: string;
  picture?: string;
  given_name: string;
  family_name?: string;
  locale: string;
  iat?: string;
  exp?: string;
  jti?: string;
  alg?: string;
  kid?: string;
  typ?: string;
}

interface dataTypes {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  id: string;
}

class userService {
  public static async verifyGoogleToken(token: string) {
    const googleOauthURL = new URL("https://oauth2.googleapis.com/tokeninfo");
    googleOauthURL.searchParams.set("id_token", token);
    try {
      const { data } = await axios.get<googleOauthTokenTypes>(
        googleOauthURL.toString(),
        {
          responseType: "json",
        }
      );
      const user = await prismaClient.user.findUnique({
        where: { email: data.email },
      });

      if (!user) {
        await prismaClient.user.create({
          data: {
            firstName: data.given_name,
            lastName: data?.family_name,
            email: data.email,
            profileImageURL: data?.picture,
          },
        });
      }

      const userInDb = await prismaClient.user.findUnique({
        where: { email: data.email },
      });

      if (!userInDb) {
        throw new Error("User not find in database");
      }
      const jwtToken = await jwtService.generateToken(userInDb);
      return jwtToken;
    } catch (error) {
      console.error("Axios Error:", error);
    }
  }

  public static async banUser(id: string) {
    await prismaClient.user.update({
      where: {
        id: id,
      },
      data: {
        ban: true,
      },
    });
    await redisClient.setex(`BAN-USER-${id}`, 86400, 1);
    return true;
  }

  public static async unBanUser(id: string) {
    await prismaClient.user.update({
      where: {
        id: id,
      },
      data: {
        ban: false,
      },
    });
    await redisClient.del(`BAN-USER-${id}`);
    return true;
  }

  public static getUserById(id: string) {
    return prismaClient.user.findUnique({ where: { id } });
  }

  public static async followUser(from: string, to: string) {
    return await prismaClient.follows.create({
      data: {
        follower: { connect: { id: from } },
        following: { connect: { id: to } },
      },
    });
  }

  public static async unFollowUser(from: string, to: string) {
    return await prismaClient.follows.delete({
      where: { followerId_followingId: { followerId: from, followingId: to } },
    });
  }

  public static async capturePayment() {
    const options = {
      amount: 99900,
      currency: "INR",
    };

    try {
      const paymentResponse = await instance.orders.create(options);
      const response = {...paymentResponse, razorpay: process.env.RAZORPAY_KEY};
      console.log("Payment response in backend: ", response);
      return response;
      
    } catch (error) {
      console.log("Error during payment: ", error);
      throw new Error("Payment failed");
    }
  }

  public static async verifyPayment(data: dataTypes) {
    const rezorpay_order_id = data.razorpay_order_id;
    const rezorpay_payment_id = data.razorpay_payment_id;
    const rezorpay_signature = data.razorpay_signature;
    console.log("order id:---------------> ", rezorpay_order_id);
    console.log("payment id:--------------> ", rezorpay_payment_id);
    console.log("signature:----------------> ", rezorpay_signature);


    if (!rezorpay_order_id || !rezorpay_payment_id || !rezorpay_signature) {
      throw new Error("Payment failed");
    }
    const body = rezorpay_order_id + "|" + rezorpay_payment_id;
    if (!process.env.RAZORPAY_SECRET) {
      throw new Error("Razoepay Secret key is not present");
    }
    const generated_signature = createHmac(
      "sha256",
      process.env.RAZORPAY_SECRET
    )
      .update(body.toString())
      .digest("hex");
      
    console.log("generated signature:------------------> ", generated_signature);
    if (generated_signature === rezorpay_signature) {
      await prismaClient.user.update({
        where: { id: data.id },
        data: { subscribe: true },
      });
      return true;
    }
  }
}

export default userService;
