import {
  Resolver,
  Mutation,
  Query,
  InputType,
  Field,
  Arg,
  FieldResolver,
  Root,
  Ctx
} from "type-graphql";
import { ObjectID } from "mongodb";

import { Author } from "../entity/Author.entity";

@InputType()
class AuthorInput {
  @Field()
  lastName!: string;

  @Field()
  firstName!: string;

  @Field()
  email!: string;

  @Field(() => [String], { defaultValue: [] })
  followers!: [ObjectID];

  @Field(() => [String], { defaultValue: [] })
  following!: [ObjectID];
}

@InputType()
class FollowInput {
  @Field()
  followerId!: string;

  @Field()
  authorId!: string;
}

@Resolver(() => Author)
export class AuthorResolver {
  @Mutation(() => Author)
  async createAuthor(@Arg("options", () => AuthorInput) options: AuthorInput) {
    const author = await Author.create(options).save();
    return author;
  }

  @Mutation(() => Boolean)
  async updateEmail(
    @Arg("id", () => String) id: string,
    @Arg("email", () => String) email: string
  ) {
    await Author.update({ id: new ObjectID(id) }, { email });

    return true;
  }

  @Mutation(() => Boolean)
  async followAuthor(@Arg("options", () => FollowInput) options: FollowInput) {
    const followerId = new ObjectID(options.followerId);
    const authorId = new ObjectID(options.authorId);

    const follower = await Author.findOne({
      where: { _id: followerId }
    });

    const author = await Author.findOne({
      where: { _id: authorId }
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

  @Query(() => [Author])
  authors() {
    return Author.find();
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
