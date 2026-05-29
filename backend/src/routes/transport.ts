import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, transportServicesTable, transportRoutesTable } from "@workspace/db";
import { ListTransportServicesQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/transport", async (req, res): Promise<void> => {
  const params = ListTransportServicesQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  let services = await db.select().from(transportServicesTable);

  if (params.data.type) {
    services = services.filter(s => s.type === params.data.type);
  }

  res.json({ services });
});

router.get("/transport/routes", async (_req, res): Promise<void> => {
  const routes = await db.select().from(transportRoutesTable);
  res.json({ routes });
});

export default router;
