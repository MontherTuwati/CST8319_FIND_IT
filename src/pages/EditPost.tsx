import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { Button, Input, Textarea, Select, Spinner } from "../components/ui";
import { toast } from "../components/ui/Toast";

const CATEGORIES = [
  { value: "", label: "Select a category" },
  { value: "Electronics", label: "Electronics" },
  { value: "Clothing", label: "Clothing" },
  { value: "Keys", label: "Keys" },
  { value: "Books", label: "Books" },
  { value: "ID/Cards", label: "ID / Cards" },
  { value: "Water Bottle", label: "Water Bottle" },
  { value: "Bags", label: "Bags" },
  { value: "Other", label: "Other" },
];

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function EditPost() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [type, setType] = useState<"lost" | "found">("lost");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [locationText, setLocationText] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [existingPhotoURL, setExistingPhotoURL] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPost() {
      if (!id) return;
      try {
        const snap = await getDoc(doc(db, "posts", id));
        if (!snap.exists()) {
          toast("error", "Post not found.");
          navigate("/");
          return;
        }
        const data = snap.data();
        if (user && data.createdBy !== user.uid) {
          toast("error", "You can only edit your own posts.");
          navigate("/");
          return;
        }
        setType(data.type);
        setTitle(data.title);
        setDescription(data.description);
        setCategory(data.category);
        setLocationText(data.locationText);
        setEventDate(data.eventDate || "");
        setExistingPhotoURL(data.photoURL || "");
      } catch (err) {
        console.error(err);
        toast("error", "Failed to load post.");
      } finally {
        setLoading(false);
      }
    }
    fetchPost();
  }, [id, user, navigate]);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (file && !file.type.startsWith("image/")) {
      toast("error", "Only image files are allowed.");
      return;
    }
    if (file && file.size > MAX_FILE_SIZE) {
      toast("error", "Image must be under 5 MB.");
      return;
    }
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!id || !user) return;
    if (!title.trim() || !description.trim() || !category || !locationText.trim()) {
      toast("error", "Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      const updates: Record<string, unknown> = {
        type,
        title: title.trim(),
        description: description.trim(),
        category,
        locationText: locationText.trim(),
        eventDate,
        updatedAt: serverTimestamp(),
      };

      if (imageFile) {
        const storageRef = ref(storage, `posts/${id}/main`);
        await uploadBytes(storageRef, imageFile);
        updates.photoURL = await getDownloadURL(storageRef);
      }

      await updateDoc(doc(db, "posts", id), updates);
      toast("success", "Post updated!");
      navigate(`/posts/${id}`);
    } catch (err) {
      console.error(err);
      toast("error", "Failed to update post.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  const previewSrc = imagePreview || existingPhotoURL;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Edit Listing</h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Update the details of your post.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">Type</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="type"
                value="lost"
                checked={type === "lost"}
                onChange={() => setType("lost")}
                className="accent-primary"
              />
              <span className="text-sm text-gray-800 dark:text-slate-200">Lost</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="type"
                value="found"
                checked={type === "found"}
                onChange={() => setType("found")}
                className="accent-primary"
              />
              <span className="text-sm text-gray-800 dark:text-slate-200">Found</span>
            </label>
          </div>
        </div>

        <Input
          id="title"
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <Textarea
          id="description"
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />

        <Select
          id="category"
          label="Category"
          options={CATEGORIES}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
        />

        <Input
          id="locationText"
          label="Location"
          value={locationText}
          onChange={(e) => setLocationText(e.target.value)}
          required
        />

        <Input
          id="eventDate"
          label="Date lost / found"
          type="date"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
        />

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
            Replace photo (optional, max 5 MB)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-primary-dark dark:text-slate-400"
          />
          {previewSrc && (
            <img
              src={previewSrc}
              alt="Preview"
              className="mt-3 h-48 w-full rounded-lg border border-gray-200 object-cover dark:border-slate-600"
            />
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={submitting} size="lg">
            {submitting ? "Saving..." : "Save Changes"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={() => navigate(`/posts/${id}`)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
