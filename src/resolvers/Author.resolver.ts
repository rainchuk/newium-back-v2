import {
  Resolver,
  Mutation,
  Query,
  InputType,
  Field,
  Arg,
  FieldResolver,
  Root,
  Ctx,
  Int,
} from 'type-graphql';
import { ObjectID } from 'mongodb';
import bcrypt from 'bcrypt';

import { Author } from '../entity/Author.entity';

import { BCRYPT_HASH_ROUNDS } from '../utils/config';
import { createTokens } from '../utils/createTokens';

@InputType()
class AuthorInput {
  @Field()
  lastName: string;

  @Field()
  firstName: string;

  @Field()
  email: string;

  @Field()
  password!: string;

  @Field(() => Int, { defaultValue: 0 })
  count: number;

  @Field(() => [String], { defaultValue: [] })
  followers: [ObjectID];

  @Field(() => [String], { defaultValue: [] })
  following: [ObjectID];
}

@InputType()
class FollowInput {
  @Field()
  followerId!: string;

  @Field()
  authorId!: string;
}

@InputType()
class AuthInput {
  @Field()
  email!: string;

  @Field()
  password!: string;
}

@Resolver(() => Author)
export class AuthorResolver {
  // TODO: update creation method
  @Mutation(() => Author)
  async createAuthor(@Arg('options', () => AuthorInput) options: AuthorInput) {
    const { email, password } = options;

    const user = await Author.findOne({ email });

    if (user) {
      throw new Error('User does exist');
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_HASH_ROUNDS);

    options.password = hashedPassword;

    const author = await Author.create(options).save();
    return author;
  }

  @Mutation(() => Boolean)
  async updateEmail(
    @Arg('id', () => String) id: string,
    @Arg('email', () => String) email: string
  ) {
    await Author.update({ id: new ObjectID(id) }, { email });

    return true;
  }

  @Mutation(() => Boolean)
  async followAuthor(@Arg('options', () => FollowInput) options: FollowInput) {
    const followerId = new ObjectID(options.followerId);
    const authorId = new ObjectID(options.authorId);

    const follower = await Author.findOne({
      where: { _id: followerId },
    });

    const author = await Author.findOne({
      where: { _id: authorId },
    });

    if (follower && author) {
      const following = follower.following;
      const followers = author.followers;

      if (
        !following.some(id => id.equals(authorId)) &&
        !followers.some(id => id.equals(followerId))
      ) {
        /** Updates current author following */
        await Author.update(
          { id: followerId },
          { following: [...following, authorId] }
        );

        /** Update author followers */
        await Author.update(
          { id: authorId },
          { followers: [...followers, followerId] }
        );

        return true;
      }
    }

    return false;
  }

  @Mutation(() => Boolean)
  async logOut(@Ctx() { req, res }: any) {
    if (!req.authorId) {
      return false;
    }

    const author = await Author.findOne(req.authorId);

    if (!author) {
      return false;
    }

    author.count += 1;
    await author.save();

    res.clearCookie('access-token');
    res.clearCookie('refresh-token');

    return true;
  }

  @Query(() => [Author])
  async authors() {
    return await Author.find();
  }

  @Query(() => Author)
  async author(@Ctx() { req }: any) {
    if (!req.authorId) {
      throw new Error('Invalid data');
    }

    return await Author.findOne(req.authorId);
  }

  @Query(() => Author)
  async login(
    @Arg('options', () => AuthInput) options: AuthInput,
    @Ctx() { res }: any
  ) {
    const { email, password } = options;

    const author = await Author.findOne({ email });

    if (!author) {
      throw new Error('Invalid data');
    }

    const valid = await bcrypt.compare(password, author.password);

    if (!valid) {
      throw new Error('Invalid data');
    }

    const { accessToken, refreshToken } = createTokens(author);

    res.cookie('refresh-token', refreshToken, {
      maxAge: 60 * 60 * 24 * 7 * 1000,
    });
    res.cookie('access-token', accessToken, { maxAge: 60 * 60 * 1000 });

    return author;
  }

  @FieldResolver(() => [Author])
  async followers(@Root() author: Author, @Ctx() ctx: any) {
    const ids: string[] = author.followers.map(id => id.toString());

    return await ctx.authorLoader.loadMany(ids);
  }

  @FieldResolver(() => [Author])
  async following(@Root() author: Author, @Ctx() ctx: any) {
    const ids: string[] = author.following.map(id => id.toString());

    return await ctx.authorLoader.loadMany(ids);
  }
}
