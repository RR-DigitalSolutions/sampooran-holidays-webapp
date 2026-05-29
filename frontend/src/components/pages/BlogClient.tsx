"use client";


import { useListBlogPosts } from "@workspace/api-client-react";
import {  } from "next/navigation";
import Link from "next/link";
import { Clock, User } from "lucide-react";

const FALLBACK_POSTS = [
  { id: 1, title: "Top 10 Things to Do in Manali in Winter", slug: "things-to-do-manali-winter", excerpt: "Discover the magic of Manali in winter — from snow sports at Solang Valley to hot springs at Vashisht.", imageUrl: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=600", author: "Sampooran Team", publishedAt: "2025-12-15T00:00:00Z", tags: ["manali", "winter", "travel tips"], readTime: 6 },
  { id: 2, title: "Leh Ladakh Road Trip — Complete Guide 2025", slug: "leh-ladakh-road-trip-guide", excerpt: "Plan the perfect Leh Ladakh road trip with this complete guide covering routes, permits, best time, and budget.", imageUrl: "https://images.unsplash.com/photo-1585136917228-84d90aa03a77?w=600", author: "Sampooran Team", publishedAt: "2025-11-20T00:00:00Z", tags: ["ladakh", "road trip", "guide"], readTime: 12 },
  { id: 3, title: "Spiti Valley Budget Travel Guide", slug: "spiti-valley-budget-guide", excerpt: "Travel to Spiti Valley on a budget without compromising on the experience. Tips on accommodation, food, and transport.", imageUrl: "https://images.unsplash.com/photo-1568454537842-d933259bb258?w=600", author: "Sampooran Team", publishedAt: "2025-10-10T00:00:00Z", tags: ["spiti", "budget travel"], readTime: 8 },
  { id: 4, title: "Best Time to Visit Kashmir — Month by Month Guide", slug: "best-time-visit-kashmir", excerpt: "From spring tulips to winter snowfall — find out which month is perfect for your Kashmir trip.", imageUrl: "https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?w=600", author: "Sampooran Team", publishedAt: "2025-09-05T00:00:00Z", tags: ["kashmir", "travel tips", "best time"], readTime: 7 },
  { id: 5, title: "Himachal Pradesh Honeymoon Destinations", slug: "himachal-honeymoon-destinations", excerpt: "Discover the most romantic honeymoon spots in Himachal — Manali, Kasauli, Dalhousie, and hidden gems.", imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600", author: "Sampooran Team", publishedAt: "2025-08-18T00:00:00Z", tags: ["honeymoon", "himachal", "romantic"], readTime: 5 },
  { id: 6, title: "Rohtang Pass — Everything You Need to Know", slug: "rohtang-pass-complete-guide", excerpt: "Permits, timings, best months, altitude sickness precautions, and what to expect at Rohtang Pass.", imageUrl: "https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?w=600", author: "Sampooran Team", publishedAt: "2025-07-12T00:00:00Z", tags: ["rohtang", "manali", "guide"], readTime: 9 },
];

export default function Blog() {
  const { data: postsData } = useListBlogPosts();
  const posts = postsData?.posts?.length ? postsData.posts : FALLBACK_POSTS;

  return (
    <>
      

      <div className="bg-primary text-white py-14 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Travel Blog</h1>
          <p className="text-white/80 text-lg">Stories, guides, and tips from the Himalayas</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map(post => (
            <Link key={post.id} href={`/blog/${post.slug}`}>
              <article className="group bg-white rounded-2xl overflow-hidden border hover:shadow-xl transition-all duration-300 cursor-pointer h-full flex flex-col">
                <div className="h-52 overflow-hidden">
                  <img src={post.imageUrl ?? "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600"} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex gap-2 flex-wrap mb-3">
                    {post.tags?.slice(0, 2).map((tag, i) => (
                      <span key={i} className="text-xs bg-accent/10 text-accent-foreground px-2 py-0.5 rounded-full">{tag}</span>
                    ))}
                  </div>
                  <h2 className="font-serif font-bold text-primary text-lg leading-tight mb-2 group-hover:text-accent transition-colors line-clamp-2">{post.title}</h2>
                  <p className="text-muted-foreground text-sm line-clamp-3 flex-1">{post.excerpt}</p>
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><User className="h-3 w-3" />{post.author}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{post.readTime} min read</span>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
