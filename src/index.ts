import { ApolloServer } from "apollo-server-express";
import { createConnection } from "typeorm";
import { buildSchema } from "type-graphql";
import express from "express";

(async function startServer() {
  const app = express();

  await createConnection({
    type: "mongodb",
    host: "localhost",
    port: 27017,
    database: "newium-v2"
  });

  const server = new ApolloServer({
    schema: await new buildSchema({}) // TODO: add schema here
  });
  server.applyMiddleware({ app });

  app.listen({ port: 5000 }, () => {
    console.log(`Listen at http://localhost:5000${server.graphqlPath}`);
  });
});
