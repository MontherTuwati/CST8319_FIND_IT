import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { Button, Badge, Spinner } from "../components/ui";
import { toast } from "../components/ui/Toast";
import type { Flag, Post } from "../types";

interface FlagWithPost extends Flag {
  postTitle: string;
  postStatus: Post["status"];
}

export default function AdminDashboard() {
  const { user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [flags, setFlags] = useState<FlagWithPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || role !== "admin") {
      toast("error", "Admin access only.");
      navigate("/");
      return;
    }

    async function fetchFlags() {
      try {
        const snap = await getDocs(collection(db, "flags"));
        const items: FlagWithPost[] = [];

        for (const d of snap.docs) {
          const flag = { id: d.id, ...d.data() } as Flag;
          let postTitle = "(deleted post)";
          let postStatus: Post["status"] = "hidden";
          try {
            const postSnap = await getDoc(doc(db, "posts", flag.postId));
            if (postSnap.exists()) {
              postTitle = postSnap.data().title;
              postStatus = postSnap.data().status;
            }
          } catch {
            /* post may have been deleted */
          }
          items.push({ ...flag, postTitle, postStatus });
        }

        items.sort((a, b) => {
          const ta = a.createdAt?.toMillis?.() ?? 0;
          const tb = b.createdAt?.toMillis?.() ?? 0;
          return tb - ta;
        });

        setFlags(items);
      } catch (err) {
        console.error("Failed to fetch flags:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchFlags();
  }, [user, role, authLoading, navigate]);

  async function handleHidePost(flag: FlagWithPost) {
    setProcessingId(flag.id);
    try {
      await updateDoc(doc(db, "posts", flag.postId), {
        status: "hidden",
        updatedAt: serverTimestamp(),
      });
      await deleteDoc(doc(db, "flags", flag.id));
      setFlags((prev) => prev.filter((f) => f.id !== flag.id));
      toast("success", `Post "${flag.postTitle}" hidden.`);
    } catch (err) {
      console.error(err);
      toast("error", "Failed to hide post.");
    } finally {
      setProcessingId(null);
    }
  }

  async function handleDismissFlag(flagId: string) {
    setProcessingId(flagId);
    try {
      await deleteDoc(doc(db, "flags", flagId));
      setFlags((prev) => prev.filter((f) => f.id !== flagId));
      toast("success", "Flag dismissed.");
    } catch (err) {
      console.error(err);
      toast("error", "Failed to dismiss flag.");
    } finally {
      setProcessingId(null);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Admin Dashboard</h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Review flagged posts and moderate content.</p>

      {flags.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-gray-300 py-16 text-center dark:border-slate-600">
          <p className="text-lg text-gray-400 dark:text-slate-500">No flagged posts.</p>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {flags.map((flag) => (
            <li
              key={flag.id}
              className="rounded-lg border border-gray-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Link
                  to={`/posts/${flag.postId}`}
                  className="font-semibold text-primary hover:underline"
                >
                  {flag.postTitle}
                </Link>
                <Badge variant={flag.postStatus} />
              </div>

              <p className="text-sm text-gray-700 dark:text-slate-300">
                <span className="font-medium text-gray-500 dark:text-slate-400">Reason: </span>
                {flag.reason}
              </p>

              <p className="mt-1 text-xs text-gray-400 dark:text-slate-500">
                Reported {flag.createdAt?.toDate?.().toLocaleDateString() ?? ""}
              </p>

              <div className="mt-3 flex gap-2">
                {flag.postStatus !== "hidden" && (
                  <Button
                    size="sm"
                    variant="danger"
                    disabled={processingId === flag.id}
                    onClick={() => handleHidePost(flag)}
                  >
                    Hide Post
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={processingId === flag.id}
                  onClick={() => handleDismissFlag(flag.id)}
                >
                  Dismiss Flag
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
