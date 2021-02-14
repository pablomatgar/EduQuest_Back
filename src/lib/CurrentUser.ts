import { Request } from "express";
import * as firebase from "firebase-admin";
import { usersCollection } from "../constants/collections";

export interface ICurrentUser {
  isLoggedIn(): Promise<boolean>;
  isStudent(): Promise<boolean>;
  isTeacher(): Promise<boolean>;
  getUser(): Promise<IUser | undefined>;
}

interface IArgs<TDataStore extends firebase.firestore.Firestore> {
  store: TDataStore;
  req: Request;
  userId?: string;
}

interface IUser {
  id: string;
  email: string;
  name: string;
  points: number;
  type: string;
}

/**
 * Gives access to the current user making the request.
 */
export class CurrentUser<TDataStore extends firebase.firestore.Firestore>
  implements ICurrentUser {
  private store: TDataStore;
  /* tslint:disable:no-unused-variable */
  private req: Request;
  private userId?: string;
  private userCached?: IUser;
  private hasAttemptedToFetchUser: boolean;
  private isLoggedInCached?: boolean;

  private constructor(args: IArgs<TDataStore>) {
    this.store = args.store;
    this.req = args.req;
    this.userId = args.userId;
    this.hasAttemptedToFetchUser = false;
  }

  /**
   * Attempts to get the user id from the Bearer token and authenticate, very insecurely, the
   * user with said id.
   * @param args
   */
  public static buildFromBearerToken<
    TDataStore extends firebase.firestore.Firestore
  >(store: TDataStore, req: Request): CurrentUser<TDataStore> {
    const authorization = req.headers.authorization;
    if (!authorization) {
      return this.publicViewer(store, req);
    }
    const userId = authorization.slice(7);
    return new CurrentUser({
      req,
      store,
      userId,
    });
  }

  public async isLoggedIn() {
    if (this.hasAttemptedToFetchUser) {
      return this.userCached !== undefined;
    }
    if (this.isLoggedInCached !== undefined) {
      return this.isLoggedInCached;
    }
    const user = await this.fetchUserFromStore();
    if (!user) {
      this.isLoggedInCached = false;
      return false;
    }
    this.isLoggedInCached = true;
    return true;
  }

  public async getUser() {
    const user = await this.fetchUserFromStore();
    return user;
  }

  public async isStudent() {
    const user = await this.getUser();
    return user !== undefined && user.type === "STUDENT";
  }

  public async isTeacher() {
    const user = await this.getUser();
    return user !== undefined && user.type === "TEACHER";
  }

  private async fetchUserFromStore() {
    if (!this.userId) {
      return undefined;
    }
    if (this.hasAttemptedToFetchUser) {
      return this.userCached;
    }
    const collection = this.store.collection(usersCollection);
    const doc = await collection.doc(this.userId).get();
    this.hasAttemptedToFetchUser = true;
    if (!doc.exists) {
      this.userCached = undefined;
      return undefined;
    }
    this.userCached = { id: this.userId, ...(doc.data() as any) };
    return this.userCached;
  }

  private static publicViewer<TDataStore extends firebase.firestore.Firestore>(
    store: TDataStore,
    req: Request
  ): CurrentUser<TDataStore> {
    return new CurrentUser({
      store,
      req,
      userId: undefined,
    });
  }
}
