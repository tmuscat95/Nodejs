const { buildSchema } = require("graphql");

module.exports = buildSchema(`
    type TestData {
        text: String!
        views: Int!
    }

    type AuthData {
        token: String!
        userId: String!

    }
    type PostData {
        posts: [Post!]!
        totalPosts: Int!
    }

    type RootQuery {
        hello: TestData!
        login(email: String!,password:String!): AuthData!
        posts(page: Int): PostData!
        post(id: ID!) : Post!
    }
    
    type Post {
        _id:ID
        title: String!
        content: String!
        imageUrl: String!
        creator: User!
        createdAt: String!
        updatedAt: String!
    }

    type User {
        _id: ID!
        name: String!
        email: String!
        password: String
        status: String!
        posts: [Post!]!
    }

    input UserInputData {
        email: String!
        name: String!
        password: String!
    }

    input PostInputData {
        title: String!
        content: String!
        imageUrl: String!
        creator: User!
        createdAt: String!
        updatedAt: String!
    }

    type RootMutation {
        createUser(userInput: UserInputData) : User!
        createPost(postInput: PostInputData) : Post!
        updatePost(id: ID!, postInput: PostInputData): Post!
        deletePost(id: ID!): Boolean!
    }

    schema {
        query: RootQuery
        mutation: RootMutation
    }

`);

/**
 * RootQuery: the root query that contains definitions for all other queries
 * hello: TestData! "hello" is a query; TestData is a data type.
 * ! means this value isn't optional.
 *
 * Note that this syntax is not JSON
 *
 * resolver for hello query must return an object fitting the data type
 */
