import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, blogPostsTable } from "@workspace/db";
import { ListBlogPostsQueryParams, GetBlogPostParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/blog", async (req, res): Promise<void> => {
  const params = ListBlogPostsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  let posts = await db.select().from(blogPostsTable).orderBy(blogPostsTable.publishedAt);

  if (params.data.tag) {
    posts = posts.filter(p => p.tags?.includes(String(params.data.tag)));
  }

  const total = posts.length;

  if (params.data.offset) {
    posts = posts.slice(Number(params.data.offset));
  }
  if (params.data.limit) {
    posts = posts.slice(0, Number(params.data.limit));
  }

  const formatted = posts.map(p => ({
    ...p,
    publishedAt: p.publishedAt?.toISOString() ?? new Date().toISOString(),
  }));

  res.json({ posts: formatted, total });
});

router.get("/blog/:slug", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const params = GetBlogPostParams.safeParse({ slug: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [post] = await db
    .select()
    .from(blogPostsTable)
    .where(eq(blogPostsTable.slug, params.data.slug));

  if (!post) {
    res.status(404).json({ error: "Blog post not found" });
    return;
  }

  res.json({
    ...post,
    publishedAt: post.publishedAt?.toISOString() ?? new Date().toISOString(),
  });
});

export default router;
