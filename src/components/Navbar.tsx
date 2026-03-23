import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between border-b px-6 py-4">
      <Link to="/" className="text-xl font-bold">
        FindIt
      </Link>
      <div className="flex items-center gap-4">
        <Link to="/login" className="text-blue-600 hover:underline">
          Log in
        </Link>
      </div>
    </nav>
  );
}
