import { Router } from "express";
import * as firebase from "firebase-admin";
import MeController from "../controllers/MeController";
import { CurrentUser } from "../lib/CurrentUser";

const router = Router();

router.use(MeController.path, async (req, res) => {
  const store = firebase.firestore();
  const cu = CurrentUser.buildFromBearerToken(store, req);
  const controller = new MeController({
    req,
    res,
    dataStore: firebase.firestore(),
    cu,
  });
  await controller.handleRequest();
});

export default router;
