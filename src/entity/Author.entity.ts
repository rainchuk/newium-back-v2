import { Entity, ObjectIdColumn, Column, BaseEntity } from "typeorm";
import { Field, ObjectType } from "type-graphql";
import { ObjectID } from "mongodb";

@ObjectType()
@Entity()
export class Author extends BaseEntity {
  @ObjectIdColumn()
  id!: ObjectID;

  @Field()
  @Column()
  lastName!: string;

  @Field()
  @Column()
  firstName!: string;

  @Field()
  @Column()
  email!: string;

  @Field(() => [Author])
  @Column({ array: true, default: [] })
  followers!: [ObjectID];

  @Field(() => [Author])
  @Column({ array: true, default: [] })
  following!: [ObjectID];
}
