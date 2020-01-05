import { Response, NextFunction, Request } from "express";
import { verify } from "jsonwebtoken";
// import { ObjectID } from "mongodb";

import { JWT_ACCESS_SECRET_KEY, JWT_REFRESH_SECRET_KEY } from "./config";
import { createTokens } from "./createTokens";

import { Author } from "../entity/Author.entity";

interface IRequest extends Request {
  authorId?: string;
}

interface IUserData {
  authorId: string;
  count?: number;
}

export const validateTokens = async (
  req: IRequest,
  res: Response,
  next: NextFunction
) => {
  const accessToken = req.cookies["access-token"];
  const refreshToken = req.cookies["refresh-token"];

  if (!accessToken && !refreshToken) {
    return next();
  }

  try {
    const data: IUserData = verify(
      accessToken,
      JWT_ACCESS_SECRET_KEY
    ) as IUserData;
    req.authorId = data.authorId;
    return next();
  } catch {}

  if (!refreshToken) {
    return next();
  }

  let data: IUserData;

  try {
    data = verify(refreshToken, JWT_REFRESH_SECRET_KEY) as IUserData;
  } catch {
    return next();
  }

  const author = await Author.findOne(data.authorId);

  if (!author || author.count !== data.count) {
    return next();
  }

  const tokens = createTokens(author);

  res.cookie("access-token", tokens.accessToken, { maxAge: 60 * 60 * 1000 });
  req.authorId = author.id.toHexString();

  next();
};
