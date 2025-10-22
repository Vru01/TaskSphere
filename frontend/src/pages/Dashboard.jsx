export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem("user"));
  return (
    <div style={{ padding: "20px" }}>
      <h2>Welcome, {user?.name}</h2>
      <p>Role: {user?.role}</p>
      <p>Use the navbar to manage tasks and notifications.</p>
    </div>
  );
}