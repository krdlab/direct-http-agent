import { Router } from "express";
import { CheckedRequest } from "../auth";

const router = Router();

router.get("/domains", async (req: CheckedRequest, res) => {
  const domains = await req.client.getDomains();
  res.send(domains);
});

router.get("/domains/:domainId/talks", async (req: CheckedRequest, res) => {
  const talks = await req.client.getTalks(req.params.domainId);
  res.send(talks);
});

router.get("/domains/:domainId/talks/:talkId/messages", (req, res) => {
  console.log(req.method, req.path);  // TODO
  res.send("");
});

router.post("/domains/:domainId/talks/:talkId/messages", async (req: CheckedRequest, res) => {
  const q = req.params;
  const result = await req.client.sendTextMessage(q.domainId, q.talkId, req.body)
    .then(r => ({status: 200, body: r}))
    .catch(e => {
      if (e === "NotFound") {
        return {status: 404, body: ""};
      } else {
        return {status: 500, body: ""};
      }
    });
  res.status(result.status).send(result.body);
});

export default router;