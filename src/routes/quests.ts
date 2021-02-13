import { Router } from "express";
import * as firebase from "firebase-admin";
import QuestsController from "../controllers/QuestsController";

const router = Router();

router.use(QuestsController.path, async (req, res) => {
  const controller = new QuestsController({
    req,
    res,
    dataStore: firebase.firestore(),
  });
  await controller.handleRequest();
});

export default router;
