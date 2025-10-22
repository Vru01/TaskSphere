import { useEffect, useState } from "react";
import API from "../api/api";

export default function Notifications() {
  const user = JSON.parse(localStorage.getItem("user"));
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = async () => {
    const { data } = await API.get(`/notifications/${user.id}`);
    setNotifications(data);
  };

  const markAllRead = async () => {
    await API.put(`/notifications/user/${user.id}/read-all`);
    fetchNotifications();
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Notifications</h2>
      <button onClick={markAllRead}>Mark All as Read</button>
      <ul>
        {notifications.map((n) => (
          <li key={n._id}>
            {n.message} — <strong>{n.read ? "Read" : "Unread"}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}