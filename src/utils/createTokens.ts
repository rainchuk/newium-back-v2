import { sign } from 'jsonwebtoken';

import { Author } from '../entity/Author.entity';
import { JWT_ACCESS_SECRET_KEY, JWT_REFRESH_SECRET_KEY } from './config';

export const createTokens = (author: Author) => {
  const accessToken = sign({ authorId: author.id }, JWT_ACCESS_SECRET_KEY, {
    expiresIn: '1h',
  });

  const refreshToken = sign(
    { authorId: author.id, count: author.count },
    JWT_REFRESH_SECRET_KEY,
    {
      expiresIn: '7d',
    }
  );

  return { accessToken, refreshToken };
};
