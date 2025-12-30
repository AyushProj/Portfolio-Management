import { useEffect, useState } from "react";

export default function App() {
  const [status, setStatus] = useState("Loading...");

  useEffect(() => {
    fetch("http://localhost:5000/")
      .then((res) => res.json())
      .then((data) => setStatus(data.message))
      .catch((err) => setStatus("Error: " + err.message));
  }, []);

  return (
    <div style={{ fontFamily: "Arial", padding: 20 }}>
      <h1>Portfolio & Trade Management</h1>
      <p><b>Backend status:</b> {status}</p>
    </div>
  );
}
