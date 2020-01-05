import { Entity, ObjectIdColumn, Column, BaseEntity } from "typeorm";
import { Field, ObjectType, Int } from "type-graphql";
import { ObjectID } from "mongodb";

@ObjectType()
@Entity("authors")
export class Author extends BaseEntity {
  @ObjectIdColumn()
  id: ObjectID;

  @Field()
  @Column()
  lastName: string;

  @Field()
  @Column()
  firstName: string;

  @Field()
  @Column()
  email: string;

  @Field(() => Int)
  @Column("int", { default: 0 })
  count: number;

  @Field()
  @Column()
  password: string;

  @Field(() => [Author])
  @Column({ array: true, default: [] })
  followers: [ObjectID];

  @Field(() => [Author])
  @Column({ array: true, default: [] })
  following: [ObjectID];
}
