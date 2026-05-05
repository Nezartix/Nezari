import { useState, useEffect } from "react";
import LoginForm from "./components/LoginForm";
import SignupForm from "./components/SignUpForm";
import Home from "./components/Home";

type User = { id: number; email: string; name: string };

const API = "http://localhost:3001/api";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSignup, setShowSignup] = useState(false);

  useEffect(() => {
    fetch(`${API}/me`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  if (user) {
    return <Home user={user} onLogout={() => setUser(null)} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-pink-50 p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-center text-4xl font-bold text-slate-900 mb-8 tracking-tight">
          Nezari
        </h1>
        {showSignup ? (
          <SignupForm onSuccess={setUser} switchToLogin={() => setShowSignup(false)} />
        ) : (
          <LoginForm onSuccess={setUser} switchToSignup={() => setShowSignup(true)} />
        )}
      </div>
    </div>
  );
}

export default App;