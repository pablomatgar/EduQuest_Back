import { Router } from "express";
import * as firebase from "firebase-admin";
import QuestsController from "../controllers/QuestsController";
import { CurrentUser } from "../lib/CurrentUser";

const router = Router();

router.use(QuestsController.path, async (req, res) => {
  const store = firebase.firestore();
  const cu = CurrentUser.buildFromBearerToken(store, req);
  const controller = new QuestsController({
    req,
    res,
    dataStore: firebase.firestore(),
    cu,
  });
  await controller.handleRequest();
});

export default router;
