export const mutations = `#graphql
    followUser(to: ID!): Boolean
    unFollowUser(to: ID!): Boolean
    banUser(id: ID!): Boolean
    unBanUser(id: ID!): Boolean
    verifyPayment(data: ResponseType): Boolean
`