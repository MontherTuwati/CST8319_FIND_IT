import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "./ui";

export default function Navbar() {
  const { user, role, loading, logout } = useAuth();

  return (
    <nav className="sticky top-0 z-40 flex items-center justify-between border-b border-gray-200 bg-white/80 px-6 py-3 backdrop-blur-md">
      <Link to="/" className="text-xl font-bold text-primary">
        FindIt
      </Link>

      <div className="flex items-center gap-3">
        {loading ? null : user ? (
          <>
            <Link to="/post/new">
              <Button size="sm">+ New Post</Button>
            </Link>
            {role === "admin" && (
              <Link to="/admin">
                <Button size="sm" variant="secondary">Admin</Button>
              </Link>
            )}
            <span className="text-sm text-gray-500 hidden sm:inline">
              {user.displayName || user.email}
            </span>
            <Button variant="ghost" size="sm" onClick={logout}>
              Log out
            </Button>
          </>
        ) : (
          <Link to="/login">
            <Button size="sm">Log in</Button>
          </Link>
        )}
      </div>
    </nav>
  );
}
