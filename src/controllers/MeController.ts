import Joi from "joi";
import * as firebase from "firebase-admin";
import { BaseController, THttpMethod } from "./BaseController";

export default class QuestsController<
  TDataStore extends firebase.firestore.Firestore
> extends BaseController<TDataStore> {
  static path = "/me";

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
      console.log(paramsData);
      await this.fetchMe();
    }
  }

  /**
   * Fetches the logged in user's data.
   */
  private async fetchMe() {
    if (!(await this.cu.isLoggedIn())) {
      console.log('Trying to fetch "me" but the viewer is not authenticated!');
      return this.notAuthorized();
    }
    const user = await this.cu.getUser();
    this.ok({ user });
  }

  // ===================== PARAMS ============================

  private getGetParams() {
    return Joi.object().keys({});
  }
}
