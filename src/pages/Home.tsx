import { useEffect, useState, useMemo } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  type QueryConstraint,
} from "firebase/firestore";
import { db } from "../firebase";
import { Spinner, Select, Input } from "../components/ui";
import PostCard from "../components/PostCard";
import type { Post } from "../types";

const TYPE_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "lost", label: "Lost" },
  { value: "found", label: "Found" },
];

const CATEGORY_OPTIONS = [
  { value: "", label: "All Categories" },
  { value: "Electronics", label: "Electronics" },
  { value: "Clothing", label: "Clothing" },
  { value: "Keys", label: "Keys" },
  { value: "Books", label: "Books" },
  { value: "ID/Cards", label: "ID / Cards" },
  { value: "Water Bottle", label: "Water Bottle" },
  { value: "Bags", label: "Bags" },
  { value: "Other", label: "Other" },
];

export default function Home() {
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const [typeFilter, setTypeFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    async function fetchPosts() {
      setLoading(true);
      try {
        const constraints: QueryConstraint[] = [];

        if (typeFilter) {
          constraints.push(where("type", "==", typeFilter));
        }
        if (categoryFilter) {
          constraints.push(where("category", "==", categoryFilter));
        }

        constraints.push(orderBy("createdAt", "desc"), limit(40));

        const q = query(collection(db, "posts"), ...constraints);
        const snap = await getDocs(q);
        setAllPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Post));
      } catch (err) {
        console.error("Failed to fetch posts:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, [typeFilter, categoryFilter]);

  const filteredPosts = useMemo(() => {
    if (!keyword.trim()) return allPosts;
    const kw = keyword.toLowerCase();
    return allPosts.filter(
      (p) =>
        p.title.toLowerCase().includes(kw) ||
        p.description.toLowerCase().includes(kw),
    );
  }, [allPosts, keyword]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Campus Lost &amp; Found</h1>
        <p className="mt-2 text-gray-500">
          Browse recent listings or create a new post to report a lost or found item.
        </p>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Select
          id="typeFilter"
          options={TYPE_OPTIONS}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        />
        <Select
          id="categoryFilter"
          options={CATEGORY_OPTIONS}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        />
        <Input
          id="keyword"
          placeholder="Search by keyword..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 py-20 text-center">
          <p className="text-gray-400 text-lg">No posts match your filters.</p>
          <p className="text-gray-400 text-sm mt-1">
            Try adjusting the filters or create a new listing!
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
