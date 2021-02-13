import Joi from "joi";
import * as firebase from "firebase-admin";
import { BaseController, THttpMethod } from "./BaseController";

export default class RoomsController<
  TDataStore extends firebase.firestore.Firestore
> extends BaseController<TDataStore> {
  static path = "/quests";

  protected permittedParams(method: THttpMethod): Joi.Schema {
    switch (method) {
      case "POST":
      case "GET":
      case "DELETE":
      case "PUT":
        return Joi.object().keys({});
    }
  }

  protected async handleRequestImpl(method: THttpMethod, paramsData: any) {}
}
