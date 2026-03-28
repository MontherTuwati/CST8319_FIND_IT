import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button, Spinner } from "../components/ui";

export default function Login() {
  const { user, loading, loginWithGoogle, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center dark:text-slate-200">
          <p className="mb-4 text-lg">
            Signed in as <span className="font-semibold">{user.displayName || user.email}</span>
          </p>
          <Button variant="secondary" onClick={logout}>
            Log out
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-lg dark:border-slate-700 dark:bg-slate-900">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">FindIt</h1>
        <p className="mt-2 text-gray-500 dark:text-slate-400">Campus Lost &amp; Found Tracker</p>
        <div className="mt-8">
          <Button size="lg" className="w-full" onClick={loginWithGoogle}>
            Continue with Google
          </Button>
        </div>
        <p className="mt-6 text-xs text-gray-400 dark:text-slate-500">
          Sign in with your college Google account to report or claim items.
        </p>
      </div>
    </div>
  );
}
