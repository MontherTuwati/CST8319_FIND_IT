import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { Button, Input, Textarea, Select } from "../components/ui";
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

export default function CreatePost() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const [type, setType] = useState<"lost" | "found">("lost");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [locationText, setLocationText] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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
    if (!user) return;
    if (!title.trim() || !description.trim() || !category || !locationText.trim()) {
      toast("error", "Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      const postRef = await addDoc(collection(db, "posts"), {
        type,
        title: title.trim(),
        description: description.trim(),
        category,
        locationText: locationText.trim(),
        eventDate,
        status: "open",
        photoURL: "",
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      if (imageFile) {
        const storageRef = ref(storage, `posts/${postRef.id}/main`);
        await uploadBytes(storageRef, imageFile);
        const photoURL = await getDownloadURL(storageRef);
        await updateDoc(doc(db, "posts", postRef.id), { photoURL });
      }

      toast("success", "Post created!");
      navigate("/");
    } catch (err) {
      console.error(err);
      toast("error", "Failed to create post. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Create a Listing</h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Report a lost or found item on campus.</p>

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
          placeholder="e.g. Black backpack with laptop"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <Textarea
          id="description"
          label="Description"
          placeholder="Describe the item, any distinguishing features..."
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
          placeholder="e.g. Library 2nd floor, Room B340"
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
            Photo (optional, max 5 MB)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-primary-dark dark:text-slate-400"
          />
          {imagePreview && (
            <img
              src={imagePreview}
              alt="Preview"
              className="mt-3 h-48 w-full rounded-lg border border-gray-200 object-cover dark:border-slate-600"
            />
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={submitting} size="lg">
            {submitting ? "Creating..." : "Create Post"}
          </Button>
          <Button type="button" variant="secondary" size="lg" onClick={() => navigate("/")}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
