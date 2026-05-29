import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, testimonialsTable } from "@workspace/db";
import { ListTestimonialsQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/testimonials", async (req, res): Promise<void> => {
  const params = ListTestimonialsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  let testimonials = await db.select().from(testimonialsTable).orderBy(testimonialsTable.createdAt);

  if (params.data.featured !== undefined) {
    testimonials = testimonials.filter(t => t.isFeatured === params.data.featured);
  }

  if (params.data.limit) {
    testimonials = testimonials.slice(0, Number(params.data.limit));
  }

  res.json({ testimonials });
});

export default router;
