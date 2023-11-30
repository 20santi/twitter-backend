export const types = `#graphql
    type User {
        id: ID!
        firstName: String!
        lastName: String
        email: String! 
        profileImageURL: String 
        role: String
        ban: Boolean
        subscribe: Boolean
        followers: [User]
        following: [User]
        likes: [Like]
        recomendedUsers: [User]
        tweets: [Tweet]
    }

    type Order {
        id: String!
        entity: String
        amount: Int!
        amount_paid: Int
        amount_due: Int
        currency: String!
        receipt: String
        offer_id: String
        status: String
        attempts: Int
        notes: [String]
        created_at: Int
        razorpay: String!
      }

    input ResponseType {
        razorpay_order_id: String!
        razorpay_payment_id: String!
        razorpay_signature: String!
        id: String!
    }
`;
