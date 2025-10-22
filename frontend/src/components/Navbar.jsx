import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const logout = () => {
    localStorage.clear();
    navigate("/auth/login");
  };

  return (
    <nav style={{ background: "#333", padding: "10px" }}>
      <Link to="/dashboard" style={{ color: "white", margin: "10px" }}>Dashboard</Link>
      <Link to="/tasks" style={{ color: "white", margin: "10px" }}>Tasks</Link>
      <Link to="/notifications" style={{ color: "white", margin: "10px" }}>Notifications</Link>
      <button onClick={logout} style={{ marginLeft: "20px" }}>Logout</button>
    </nav>
  );
}
