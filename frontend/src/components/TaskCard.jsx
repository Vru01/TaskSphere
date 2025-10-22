// TaskCard.jsx
export default function TaskCard({ task }) {
  return (
    <div style={{
      border: "1px solid #ccc",
      borderRadius: "8px",
      padding: "10px",
      marginBottom: "10px",
      backgroundColor: "#f9f9f9"
    }}>
      <h3>{task.title}</h3>
      <p>{task.description}</p>
      <p>
        Assigned to: <strong>{task.assignedToName || "N/A"}</strong>
      </p>
      <p>Status: <em>{task.status}</em></p>
      <p>Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "N/A"}</p>
    </div>
  );
}