import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  doc,
  getDoc,
  deleteDoc,
  collection,
  addDoc,
  updateDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { db, storage } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { Button, Badge, Spinner, Textarea } from "../components/ui";
import { toast } from "../components/ui/Toast";
import type { Post, Claim } from "../types";

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  // Claim submission (viewer)
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [claimMessage, setClaimMessage] = useState("");
  const [submittingClaim, setSubmittingClaim] = useState(false);
  const [alreadyClaimed, setAlreadyClaimed] = useState(false);

  // Claims list (owner)
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loadingClaims, setLoadingClaims] = useState(false);
  const [processingClaimId, setProcessingClaimId] = useState<string | null>(null);

  // Report / flag (viewer)
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);

  const isOwner = user && post && user.uid === post.createdBy;
  const canClaim =
    user &&
    post &&
    post.type === "found" &&
    (post.status === "open" || post.status === "in_review") &&
    user.uid !== post.createdBy &&
    !alreadyClaimed;

  useEffect(() => {
    async function fetchPost() {
      if (!id) return;
      try {
        const snap = await getDoc(doc(db, "posts", id));
        if (snap.exists()) {
          setPost({ id: snap.id, ...snap.data() } as Post);
        }
      } catch (err) {
        console.error("Failed to fetch post:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPost();
  }, [id]);

  useEffect(() => {
    if (!id || !user) return;
    async function checkExistingClaim() {
      const q = query(
        collection(db, "claims"),
        where("postId", "==", id),
        where("claimantId", "==", user!.uid),
      );
      const snap = await getDocs(q);
      setAlreadyClaimed(!snap.empty);
    }
    checkExistingClaim();
  }, [id, user]);

  useEffect(() => {
    if (!id || !isOwner) return;
    async function fetchClaims() {
      setLoadingClaims(true);
      try {
        const q = query(collection(db, "claims"), where("postId", "==", id));
        const snap = await getDocs(q);
        setClaims(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() }) as Claim)
            .sort((a, b) => {
              const ta = a.createdAt?.toMillis?.() ?? 0;
              const tb = b.createdAt?.toMillis?.() ?? 0;
              return tb - ta;
            }),
        );
      } catch (err) {
        console.error("Failed to fetch claims:", err);
      } finally {
        setLoadingClaims(false);
      }
    }
    fetchClaims();
  }, [id, isOwner]);

  async function handleDelete() {
    if (!id || !post) return;
    if (!window.confirm("Are you sure you want to delete this post? This cannot be undone."))
      return;

    setDeleting(true);
    try {
      if (post.photoURL) {
        await deleteObject(ref(storage, `posts/${id}/main`)).catch(() => {});
      }
      await deleteDoc(doc(db, "posts", id));
      toast("success", "Post deleted.");
      navigate("/");
    } catch (err) {
      console.error("Delete failed:", err);
      toast("error", "Failed to delete post.");
      setDeleting(false);
    }
  }

  async function handleSubmitClaim() {
    if (!id || !user || !claimMessage.trim()) {
      toast("error", "Please describe how you can identify this item.");
      return;
    }
    setSubmittingClaim(true);
    try {
      await addDoc(collection(db, "claims"), {
        postId: id,
        claimantId: user.uid,
        message: claimMessage.trim(),
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast("success", "Claim submitted! The owner will review it.");
      setClaimMessage("");
      setShowClaimForm(false);
      setAlreadyClaimed(true);
    } catch (err) {
      console.error(err);
      toast("error", "Failed to submit claim.");
    } finally {
      setSubmittingClaim(false);
    }
  }

  async function handleApproveClaim(claimId: string) {
    if (!id) return;
    setProcessingClaimId(claimId);
    try {
      const batch = writeBatch(db);

      batch.update(doc(db, "claims", claimId), {
        status: "approved",
        updatedAt: serverTimestamp(),
      });

      batch.update(doc(db, "posts", id), {
        status: "resolved",
        updatedAt: serverTimestamp(),
      });

      const otherPending = claims.filter((c) => c.id !== claimId && c.status === "pending");
      for (const c of otherPending) {
        batch.update(doc(db, "claims", c.id), {
          status: "denied",
          updatedAt: serverTimestamp(),
        });
      }

      await batch.commit();

      setClaims((prev) =>
        prev.map((c) => {
          if (c.id === claimId) return { ...c, status: "approved" };
          if (c.status === "pending") return { ...c, status: "denied" };
          return c;
        }),
      );
      setPost((prev) => (prev ? { ...prev, status: "resolved" } : prev));
      toast("success", "Claim approved — post marked as resolved.");
    } catch (err) {
      console.error(err);
      toast("error", "Failed to approve claim.");
    } finally {
      setProcessingClaimId(null);
    }
  }

  async function handleDenyClaim(claimId: string) {
    setProcessingClaimId(claimId);
    try {
      await updateDoc(doc(db, "claims", claimId), {
        status: "denied",
        updatedAt: serverTimestamp(),
      });
      setClaims((prev) =>
        prev.map((c) => (c.id === claimId ? { ...c, status: "denied" } : c)),
      );
      toast("success", "Claim denied.");
    } catch (err) {
      console.error(err);
      toast("error", "Failed to deny claim.");
    } finally {
      setProcessingClaimId(null);
    }
  }

  async function handleSubmitReport() {
    if (!id || !user || !reportReason.trim()) {
      toast("error", "Please provide a reason for reporting.");
      return;
    }
    setSubmittingReport(true);
    try {
      await addDoc(collection(db, "flags"), {
        postId: id,
        flaggedBy: user.uid,
        reason: reportReason.trim(),
        createdAt: serverTimestamp(),
      });
      toast("success", "Report submitted. An admin will review it.");
      setReportReason("");
      setShowReportForm(false);
    } catch (err) {
      console.error(err);
      toast("error", "Failed to submit report.");
    } finally {
      setSubmittingReport(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Post not found</h2>
        <p className="mt-2 text-gray-500 dark:text-slate-400">It may have been deleted or the link is incorrect.</p>
        <Button className="mt-6" onClick={() => navigate("/")}>
          Back to Home
        </Button>
      </div>
    );
  }

  const formattedDate = post.createdAt?.toDate
    ? post.createdAt.toDate().toLocaleDateString("en-CA", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 text-sm text-primary hover:underline cursor-pointer"
      >
        &larr; Back
      </button>

      {post.photoURL && (
        <img
          src={post.photoURL}
          alt={post.title}
          className="w-full max-h-[28rem] rounded-xl border border-gray-200 object-cover dark:border-slate-600"
        />
      )}

      <div className="mt-6">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Badge variant={post.type} />
          <Badge variant={post.status} />
          <span className="text-xs text-gray-400 dark:text-slate-500">{post.category}</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{post.title}</h1>

        <p className="mt-4 whitespace-pre-wrap leading-relaxed text-gray-700 dark:text-slate-300">
          {post.description}
        </p>

        <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="font-medium text-gray-500 dark:text-slate-400">Location</dt>
            <dd className="mt-1 text-gray-900 dark:text-slate-100">{post.locationText}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500 dark:text-slate-400">Date lost / found</dt>
            <dd className="mt-1 text-gray-900 dark:text-slate-100">{post.eventDate || "—"}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500 dark:text-slate-400">Posted</dt>
            <dd className="mt-1 text-gray-900 dark:text-slate-100">{formattedDate}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500 dark:text-slate-400">Status</dt>
            <dd className="mt-1">
              <Badge variant={post.status} />
            </dd>
          </div>
        </dl>

        {/* --- Claim this item (viewer) --- */}
        {canClaim && !showClaimForm && (
          <div className="mt-8 border-t border-gray-200 pt-6 dark:border-slate-700">
            <Button onClick={() => setShowClaimForm(true)}>Claim this item</Button>
          </div>
        )}

        {alreadyClaimed && !isOwner && (
          <p className="mt-6 text-sm italic text-gray-500 dark:text-slate-400">
            You have already submitted a claim for this item.
          </p>
        )}

        {showClaimForm && (
          <div className="mt-6 space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-slate-600 dark:bg-slate-800/50">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-200">Submit a Claim</h3>
            <Textarea
              id="claimMessage"
              placeholder="Describe how you can identify this item (colour, marks, contents, etc.)..."
              value={claimMessage}
              onChange={(e) => setClaimMessage(e.target.value)}
            />
            <div className="flex gap-2">
              <Button onClick={handleSubmitClaim} disabled={submittingClaim} size="sm">
                {submittingClaim ? "Sending..." : "Send Claim"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowClaimForm(false);
                  setClaimMessage("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* --- Report / Flag (viewer, non-owner) --- */}
        {user && post && !isOwner && (
          <div className="mt-6">
            {!showReportForm ? (
              <button
                onClick={() => setShowReportForm(true)}
                className="cursor-pointer text-sm text-gray-400 hover:text-danger dark:text-slate-500"
              >
                Report this post
              </button>
            ) : (
              <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-slate-600 dark:bg-slate-800/50">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-200">Report Post</h3>
                <Textarea
                  id="reportReason"
                  placeholder="Why are you reporting this post?"
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={handleSubmitReport}
                    disabled={submittingReport}
                  >
                    {submittingReport ? "Sending..." : "Submit Report"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowReportForm(false);
                      setReportReason("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- Owner actions --- */}
        {isOwner && (
          <div className="mt-8 space-y-6 border-t border-gray-200 pt-6 dark:border-slate-700">
            <div className="flex gap-3">
              <Link to={`/posts/${post.id}/edit`}>
                <Button variant="secondary">Edit Post</Button>
              </Link>
              <Button variant="danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? "Deleting..." : "Delete Post"}
              </Button>
            </div>

            {/* Claims management */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                Claims {claims.length > 0 && `(${claims.length})`}
              </h2>

              {loadingClaims ? (
                <Spinner className="mt-3" />
              ) : claims.length === 0 ? (
                <p className="mt-2 text-sm text-gray-400 dark:text-slate-500">No claims yet.</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {claims.map((claim) => (
                    <li
                      key={claim.id}
                      className="rounded-lg border border-gray-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={claim.status} />
                        <span className="text-xs text-gray-400 dark:text-slate-500">
                          {claim.createdAt?.toDate?.().toLocaleDateString() ?? ""}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-slate-300">
                        {claim.message}
                      </p>
                      {claim.status === "pending" && (
                        <div className="mt-3 flex gap-2">
                          <Button
                            size="sm"
                            variant="success"
                            disabled={processingClaimId === claim.id}
                            onClick={() => handleApproveClaim(claim.id)}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            disabled={processingClaimId === claim.id}
                            onClick={() => handleDenyClaim(claim.id)}
                          >
                            Deny
                          </Button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
