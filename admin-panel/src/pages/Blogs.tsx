import { useState } from "react";
import AdminLayout from "../components/AdminLayout";
import { Plus, Search, Edit, Trash2, FileText, Eye, Calendar, Tag, CheckCircle, XCircle } from "lucide-react";

const BLOGS = [
  { id: 1, title: "Top 10 Places to Visit in Himachal Pradesh", category: "Destination Guide", author: "Sampooran Team", views: 4230, status: "published", date: "12 Apr 2026" },
  { id: 2, title: "Best Time to Visit Leh Ladakh: A Complete Guide", category: "Travel Tips", author: "Admin", views: 3820, status: "published", date: "10 Apr 2026" },
  { id: 3, title: "Kashmir on a Budget: 7 Days Under ₹25,000", category: "Budget Travel", author: "Sampooran Team", views: 5100, status: "published", date: "05 Apr 2026" },
  { id: 4, title: "Honeymoon in Maldives: Ultimate Couples Guide", category: "Honeymoon", author: "Admin", views: 2900, status: "draft", date: "01 Apr 2026" },
  { id: 5, title: "Group Tour Planning: Tips from Experts", category: "Travel Tips", author: "Sampooran Team", views: 1800, status: "published", date: "28 Mar 2026" },
];

export default function Blogs() {
  const [search, setSearch] = useState("");
  const filtered = BLOGS.filter(b => b.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <AdminLayout title="Blog Posts" subtitle="Create and manage travel content">
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search blog posts..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1B3A6B] bg-white" />
        </div>
        <a href="/blogs/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white shrink-0"
          style={{ background: "linear-gradient(135deg, #1B3A6B, #2a519b)" }}>
          <Plus className="w-4 h-4" /> New Post
        </a>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: "#F8FAFC" }} className="border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3.5 uppercase tracking-wide">Post Title</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3.5 uppercase tracking-wide hidden sm:table-cell">Category</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3.5 uppercase tracking-wide hidden md:table-cell">Views</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3.5 uppercase tracking-wide hidden lg:table-cell">Date</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3.5 uppercase tracking-wide">Status</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3.5 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(post => (
                <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: "linear-gradient(135deg, #EEF2FF, #DBEAFE)" }}>
                        <FileText className="w-4 h-4 text-[#1B3A6B]" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-gray-900 line-clamp-1">{post.title}</p>
                        <p className="text-xs text-gray-400">By {post.author}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 hidden sm:table-cell">
                    <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ background: "#EEF2FF", color: "#1B3A6B" }}>
                      {post.category}
                    </span>
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell">
                    <div className="flex items-center gap-1 text-sm text-gray-700">
                      <Eye className="w-3.5 h-3.5 text-gray-400" />
                      {post.views.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-4 py-4 hidden lg:table-cell">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />{post.date}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 w-fit ${
                      post.status === "published" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}>
                      {post.status === "published" ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {post.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"><Eye className="w-4 h-4" /></button>
                      <a href={`/blogs/${post.id}/edit`} className="p-1.5 rounded-lg hover:bg-amber-50 text-gray-400 hover:text-amber-600 transition-colors"><Edit className="w-4 h-4" /></a>
                      <button className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
