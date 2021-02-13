import { Router } from "express";
import * as firebase from "firebase-admin";
import RoomsController from "../controllers/RoomsController";
import { CurrentUser } from "../lib/CurrentUser";

const router = Router();

router.use(RoomsController.path, async (req, res) => {
  const store = firebase.firestore();
  const cu = CurrentUser.buildFromBearerToken(store, req);
  const controller = new RoomsController({
    req,
    res,
    dataStore: firebase.firestore(),
    cu,
  });
  await controller.handleRequest();
});

export default router;
