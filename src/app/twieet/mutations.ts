export const mutations = `#graphql
    createTweet(payload: CreateTweetData!): Tweet
    deleteTweet(id: ID!): Boolean
`