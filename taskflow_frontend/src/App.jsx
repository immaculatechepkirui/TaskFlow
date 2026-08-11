import { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

const API_BASE = "http://localhost:5244/api";
const STATUSES = ["To Do", "In Progress", "Done"];

function nextStatus(current) {
  const i = STATUSES.indexOf(current);
  return STATUSES[(i + 1) % STATUSES.length];
}

function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE}/tasks`);
      setTasks(response.data);
    } catch (err) {
      setError("Could not load tasks. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError("Title is required.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await axios.post(`${API_BASE}/tasks`, {
        title,
        description,
        status: "To Do",
      });
      setTasks((prev) => [...prev, response.data]);
      setTitle("");
      setDescription("");
      setFormOpen(false);
    } catch (err) {
      const serverMessage = err.response?.data?.error;
      setFormError(serverMessage || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusCycle = async (task) => {
    const newStatus = nextStatus(task.status);
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
    );

    try {
      await axios.put(`${API_BASE}/tasks/${task.id}`, { status: newStatus });
    } catch (err) {
      setError("Could not update task status.");
      fetchTasks();
    }
  };

  const handleDelete = async (taskId) => {
    const previousTasks = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== taskId));

    try {
      await axios.delete(`${API_BASE}/tasks/${taskId}`);
    } catch (err) {
      setError("Could not delete task.");
      setTasks(previousTasks);
    }
  };

  const columnClass = (status) =>
    "col-" + status.toLowerCase().replace(" ", "-");

  return (
    <div className="app">
      <header className="app-header">
        <h1>TaskFlow</h1>
        <p>A focused way to track what's next.</p>
      </header>

      <div className="toolbar">
        <button className="new-task-btn" onClick={() => setFormOpen((o) => !o)}>
          {formOpen ? "Close" : "+ New Task"}
        </button>
      </div>

      {formOpen && (
        <form className="task-form" onSubmit={handleCreate}>
          {formError && <p className="form-error">{formError}</p>}

          <label htmlFor="task-title">Title</label>
          <input
            id="task-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Write project README"
            autoFocus
          />

          <label htmlFor="task-description">Description</label>
          <textarea
            id="task-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional details…"
            rows={2}
          />

          <button type="submit" disabled={submitting}>
            {submitting ? "Adding…" : "Add Task"}
          </button>
        </form>
      )}

      {loading && <p className="status-message">Loading tasks…</p>}

      {error && (
        <div className="status-message error">
          <p>{error}</p>
          <button onClick={fetchTasks}>Retry</button>
        </div>
      )}

      {!loading && !error && (
        <div className="board">
          {STATUSES.map((status) => {
            const columnTasks = tasks.filter((t) => t.status === status);
            return (
              <div key={status} className={`board-column ${columnClass(status)}`}>
                <div className="column-header">
                  <span className="column-dot" />
                  <h2>{status}</h2>
                  <span className="column-count">{columnTasks.length}</span>
                </div>

                <div className="column-body">
                  {columnTasks.length === 0 && (
                    <p className="column-empty">No tasks here</p>
                  )}

                  {columnTasks.map((task) => (
                    <div key={task.id} className="task-card">
                      <div className="task-card-top">
                        <h3>{task.title}</h3>
                        <button
                          className="delete-icon-btn"
                          onClick={() => handleDelete(task.id)}
                          aria-label={`Delete ${task.title}`}
                        >
                          <svg viewBox="0 0 24 24" width="16" height="16">
                            <path
                              fill="currentColor"
                              d="M6 7h12l-1 13H7L6 7zm3-3h6l1 2H8l1-2z"
                            />
                          </svg>
                        </button>
                      </div>

                      {task.description && <p>{task.description}</p>}

                      <button
                        className="status-pill"
                        onClick={() => handleStatusCycle(task)}
                        title="Click to move to next status"
                      >
                        {task.status} →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default App;