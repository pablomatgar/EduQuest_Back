import Joi from "joi";
import * as firebase from "firebase-admin";
import { BaseController, THttpMethod } from "./BaseController";
import { questsCollection } from "../constants/collections";
import { v4 as uuidv4 } from "uuid";

interface IQuestCreateData {
  name: string;
  description: string;
  creatorId: string;
  roomId: string;
  reward: {
    points: number;
    description: string;
    type: string;
  };
}

interface IGetQuestsData {
  roomId?: string;
  take: number;
  skip: number;
}

export default class QuestsController<
  TDataStore extends firebase.firestore.Firestore
> extends BaseController<TDataStore> {
  static path = "/quests";

  protected permittedParams(method: THttpMethod): Joi.Schema {
    switch (method) {
      case "POST":
        return this.getPostParams();
      case "GET":
        return this.getGetParams();
      case "DELETE":
      case "PUT":
        return Joi.object().keys({});
    }
  }

  protected async handleRequestImpl(method: THttpMethod, paramsData: any) {
    if (method === "POST") {
      await this.createQuest(paramsData);
    } else if (method === "GET") {
      await this.getQuests(paramsData);
    }
  }

  /**
   * Saves a new quest to the database and returns the quest data.
   * @param data
   */
  private async createQuest(data: IQuestCreateData) {
    if (!this.dataStore) {
      console.log("No data store found so no DB writes can happen :(");
      return;
    }
    const questId = uuidv4();
    const collection = this.dataStore.collection(questsCollection);
    try {
      await collection.doc(questId).set(data);
    } catch (err) {
      console.log("An error ocurred while creating a quest");
      console.log(err);
      return this.serverError();
    }
    this.ok({ quest: { id: questId, ...data } });
  }

  private async getQuests(params: IGetQuestsData) {
    if (!this.dataStore) {
      console.log("No data store found so no DB reads can happen :(");
      return;
    }
    const collection = this.dataStore.collection(questsCollection);
    let query = collection
      .limit(Number(params.take))
      .offset(Number(params.skip));
    if (params.roomId) {
      query = collection.where("roomId", "==", params.roomId);
    }
    const snapshot = await query.get();
    const quests: any[] = [];
    if (snapshot.empty) {
      return this.ok({ quests });
    }
    snapshot.forEach((doc) => {
      quests.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    this.ok({ quests });
  }

  // ===================== PARAMS ============================

  private getPostParams() {
    return Joi.object().keys({
      name: Joi.string().required(),
      description: Joi.string().required(),
      creatorId: Joi.string().required(),
      roomId: Joi.string().required(),
      reward: Joi.object()
        .keys({
          points: Joi.number().min(0).required(),
          description: Joi.string().required(),
          type: Joi.string().required(),
        })
        .required(),
    });
  }

  private getGetParams() {
    return Joi.object().keys({
      roomId: Joi.string().optional(),
      take: Joi.number().required(),
      skip: Joi.number().required(),
    });
  }
}
