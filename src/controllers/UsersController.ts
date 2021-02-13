import Joi from "joi";
import * as firebase from "firebase-admin";
import { BaseController, THttpMethod } from "./BaseController";
import { usersCollection } from "../constants/collections";

export default class UsersController<
  TDataStore extends firebase.firestore.Firestore
> extends BaseController<TDataStore> {
  static path = "/users";

  protected permittedParams(method: THttpMethod): Joi.Schema {
    switch (method) {
      case "GET":
        return this.getGetParams();
      case "POST":
      case "DELETE":
      case "PUT":
        return Joi.object().keys({});
    }
  }

  protected async handleRequestImpl(method: THttpMethod, paramsData: any) {
    if (method === "GET") {
      await this.fetchUsers(paramsData);
    }
  }

  private async fetchUsers(paramsData) {
    if (!this.dataStore) {
      throw new Error("No data store found to fetch users!");
    }
    if (!(await this.cu.isLoggedIn())) {
      return this.notAuthorized();
    }
    const collection = this.dataStore.collection(usersCollection);
    let query = collection
      .limit(Number(paramsData.take))
      .offset(Number(paramsData.skip));
    if (paramsData.type) {
      query = query.where("type", "==", paramsData.type);
    }
    const snapshot = await query.get();
    const users: any[] = [];
    snapshot.forEach((doc) => {
      users.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    this.ok({ users });
  }

  private getGetParams() {
    return Joi.object().keys({
      take: Joi.number().min(0).required(),
      skip: Joi.number().min(0).required(),
      type: Joi.string().valid("STUDENT", "TEACHER").optional(),
    });
  }
}
