import DataLoader from 'dataloader';
import { ObjectID } from 'mongodb';

import { Author } from '../entity/Author.entity';

type BatchAuthor = (ids: readonly string[]) => Promise<Author[]>;
type AuthorsMap = { [key: string]: Author };

const batchAuthors: BatchAuthor = async ids => {
  const _ids = ids.map(id => new ObjectID(id));

  const authors = await Author.find({
    where: {
      _id: {
        $in: _ids,
      },
    },
  });

  const authorsMap: AuthorsMap = {};

  authors.forEach(author => {
    authorsMap[author.id.toString()] = author;
  });

  return ids.map(id => authorsMap[id]);
};

export const authorLoader = () => new DataLoader(batchAuthors);
