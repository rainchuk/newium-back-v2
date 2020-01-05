require('dotenv').config();

import 'reflect-metadata';
import { ApolloServer } from 'apollo-server-express';
import { createConnection } from 'typeorm';
import { buildSchema } from 'type-graphql';
import express from 'express';
import cookieParser from 'cookie-parser';

import { AuthorResolver } from './resolvers/Author.resolver';

import { authorLoader } from './loaders/Author.loader';

import { validateTokens } from './utils/validateTokens';

(async () => {
  const app = express();

  app.use(cookieParser());

  await createConnection({
    type: 'mongodb',
    host: 'localhost',
    port: 27017,
    database: 'newium-v2',
    entities: [__dirname + '/entity/*.entity.ts'],
  });

  const server = new ApolloServer({
    schema: await buildSchema({
      resolvers: [AuthorResolver],
    }),
    context: ({ req, res }) => ({
      req,
      res,
      authorLoader: authorLoader(),
    }),
  });

  // Access & Refresh tokens validation
  app.use(validateTokens);

  server.applyMiddleware({ app });

  app.listen(5000, () => {
    console.log(`Listen at http://localhost:5000${server.graphqlPath}`);
  });
})();
