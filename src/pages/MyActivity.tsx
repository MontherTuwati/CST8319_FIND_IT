import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { Badge, Spinner } from "../components/ui";
import type { Post, Claim } from "../types";

interface PostWithClaims extends Post {
  pendingClaims: Claim[];
}

export default function MyActivity() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostWithClaims[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetchActivity() {
      try {
        const postsSnap = await getDocs(
          query(
            collection(db, "posts"),
            where("createdBy", "==", user!.uid),
            orderBy("createdAt", "desc"),
          ),
        );

        const myPosts = postsSnap.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as Post,
        );

        const results: PostWithClaims[] = [];

        for (const post of myPosts) {
          const claimsSnap = await getDocs(
            query(
              collection(db, "claims"),
              where("postId", "==", post.id),
              where("status", "==", "pending"),
            ),
          );
          const pendingClaims = claimsSnap.docs.map(
            (d) => ({ id: d.id, ...d.data() }) as Claim,
          );
          results.push({ ...post, pendingClaims });
        }

        results.sort((a, b) => b.pendingClaims.length - a.pendingClaims.length);
        setPosts(results);
      } catch (err) {
        console.error("Failed to fetch activity:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchActivity();
  }, [user]);

  const totalPending = posts.reduce((sum, p) => sum + p.pendingClaims.length, 0);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">My Activity</h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
        {totalPending > 0
          ? `You have ${totalPending} pending claim${totalPending > 1 ? "s" : ""} to review.`
          : "No pending claims right now."}
      </p>

      {posts.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-gray-300 py-16 text-center dark:border-slate-600">
          <p className="text-lg text-gray-400 dark:text-slate-500">You haven't created any posts yet.</p>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {posts.map((post) => (
            <li key={post.id}>
              <Link
                to={`/posts/${post.id}`}
                className="block rounded-lg border border-gray-200 bg-white p-4 transition hover:shadow-md dark:border-slate-700 dark:bg-slate-900"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge variant={post.type} />
                    <Badge variant={post.status} />
                    <h3 className="truncate font-semibold text-gray-900 dark:text-slate-100">
                      {post.title}
                    </h3>
                  </div>
                  {post.pendingClaims.length > 0 && (
                    <span className="ml-3 flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-danger px-2 text-xs font-bold text-white shrink-0">
                      {post.pendingClaims.length}
                    </span>
                  )}
                </div>
                <div className="mt-2 flex items-center gap-3 text-xs text-gray-400 dark:text-slate-500">
                  <span>{post.category}</span>
                  <span>·</span>
                  <span>{post.locationText}</span>
                  {post.pendingClaims.length > 0 && (
                    <>
                      <span>·</span>
                      <span className="text-danger font-medium">
                        {post.pendingClaims.length} pending claim{post.pendingClaims.length > 1 ? "s" : ""}
                      </span>
                    </>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
