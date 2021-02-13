import Joi from "joi";
import * as firebase from "firebase-admin";
import { v4 as uuidv4 } from "uuid";
import { BaseController, THttpMethod } from "./BaseController";
import { roomsCollection } from "../constants/collections";

interface ICreateRoomsData {
  name: string;
  description: string;
  studentIds: string[];
  questIds: string[];
}

export default class RoomsController<
  TDataStore extends firebase.firestore.Firestore
> extends BaseController<TDataStore> {
  static path = "/rooms";

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
      await this.createRoom(paramsData);
    } else if (method === "GET") {
      await this.getRooms(paramsData);
    }
  }

  /**
   * If the user making a request is a teacher, creates a new room.
   * @param paramsData
   */
  private async createRoom(paramsData: ICreateRoomsData) {
    if (!(await this.cu.isTeacher())) {
      console.log("Only teachers can create rooms");
      return this.notAuthorized();
    }
    if (!this.dataStore) {
      throw new Error("No data store was found to create a new room");
    }
    const roomId = uuidv4();
    const collection = this.dataStore.collection(roomsCollection);
    try {
      const teacher = await this.cu.getUser();
      if (!teacher) {
        throw new Error("No teacher found!");
      }
      await collection
        .doc(roomId)
        .set({ teacherId: teacher.id, ...paramsData });
    } catch (err) {
      console.log("Could not create a room!");
      console.log(err);
      return this.serverError();
    }
    this.ok({ room: { id: roomId, ...paramsData } });
  }

  private async getRooms(paramsData) {
    if (!(await this.cu.isLoggedIn())) {
      console.log("Trying to fetch rooms but user is not logged in!");
      return this.notAuthorized();
    }
    if (!this.dataStore) {
      throw new Error("No data store was found to fetch rooms!");
    }

    const user = await this.cu.getUser();
    const collection = this.dataStore.collection(roomsCollection);
    let query = collection.limit(paramsData.take).offset(paramsData.skip);
    if (await this.cu.isTeacher()) {
      query = query.where("teacherId", "==", user!.id);
    } else {
      query = query.where("studentIds", "array-contains", user!.id);
    }
    const snapshot = await query.get();
    const rooms: any[] = [];
    if (snapshot.empty) {
      return this.ok({ rooms });
    }
    snapshot.forEach((doc) => {
      rooms.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    this.ok({ rooms });
  }

  private getGetParams() {
    return Joi.object().keys({
      take: Joi.number().min(0).required(),
      skip: Joi.number().min(0).required(),
    });
  }

  private getPostParams() {
    return Joi.object().keys({
      name: Joi.string().min(2).required(),
      description: Joi.string().min(5).required(),
      studentIds: Joi.array().items(Joi.string()).required(),
      questIds: Joi.array().items(Joi.string()).required(),
    });
  }
}
