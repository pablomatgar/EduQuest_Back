import { Router } from "express";
import * as firebase from "firebase-admin";
import UsersController from "../controllers/UsersController";
import { CurrentUser } from "../lib/CurrentUser";

const router = Router();

router.use(UsersController.path, async (req, res) => {
  const store = firebase.firestore();
  const cu = CurrentUser.buildFromBearerToken(store, req);
  const controller = new UsersController({
    req,
    res,
    dataStore: firebase.firestore(),
    cu,
  });
  await controller.handleRequest();
});

export default router;
