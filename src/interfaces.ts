export interface jwtUser {
    id: string,
    email: string
    role: string
}

export interface graphqlContext {
    user: jwtUser | null | undefined;
}