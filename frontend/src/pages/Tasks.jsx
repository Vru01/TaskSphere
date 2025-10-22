import { useState, useEffect } from "react";
import API from "../api/api";
import TaskCard from "../components/TaskCard";

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [employees, setEmployees] = useState([]);

  const user = JSON.parse(localStorage.getItem("user"));

  const fetchTasks = async () => {
    try {
      const { data } = await API.get("/tasks");
      setTasks(data);
    } catch (err) {
      console.error("Failed to fetch tasks:", err.response?.data?.message || err.message);
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data } = await API.get("/users/employees");
      setEmployees(data);
    } catch (err) {
      console.error("Failed to fetch employees:", err.response?.data?.message || err.message);
    }
  };

  const createTask = async () => {
    if (user.role !== "manager") return alert("Only managers can create tasks");
    try {
      await API.post("/tasks", {
        title,
        description: desc,
        assignedTo,
        assignedToName: employees.find(e => e._id === assignedTo)?.name || "",
      });
      setTitle(""); setDesc(""); setAssignedTo("");
      fetchTasks();
    } catch (err) {
      console.error("Failed to create task:", err.response?.data?.message || err.message);
    }
  };

  useEffect(() => {
    fetchTasks();
    if (user.role === "manager") fetchEmployees();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Tasks</h2>

      {user.role === "manager" && (
        <div style={{ marginBottom: "20px" }}>
          <input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
          <input placeholder="Description" value={desc} onChange={e => setDesc(e.target.value)} />
          <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)}>
            <option value="">Select Employee</option>
            {employees.map(emp => (
              <option key={emp._id} value={emp._id}>{emp.name}</option>
            ))}
          </select>
          <button onClick={createTask}>Create Task</button>
        </div>
      )}

      {tasks.length > 0 ? (
        tasks.map(task => <TaskCard key={task._id} task={task} />)
      ) : (
        <p>No tasks found.</p>
      )}
    </div>
  );
}
