using TaskflowBackend.Models;

namespace TaskflowBackend.Services;

public class TaskService
{
    private readonly List<TaskItem> _tasks = new();
    private int _nextId = 1;

    public TaskService()
    {
        // Seed a couple of sample tasks so the list isn't empty on first load
        AddTask("Set up project structure", "Scaffold backend and frontend folders", "Done");
        AddTask("Design task model", "Define fields for title, description, status", "In Progress");
        AddTask("Write README", "Document setup steps and assumptions", "To Do");
    }

    public List<TaskItem> GetAll() => _tasks;

    public TaskItem? GetById(int id) =>
        _tasks.FirstOrDefault(t => t.Id == id);

    public TaskItem AddTask(string title, string description, string status)
    {
        var task = new TaskItem
        {
            Id = _nextId++,
            Title = title,
            Description = description,
            Status = status
        };
        _tasks.Add(task);
        return task;
    }

    public bool UpdateTask(int id, string? title, string? description, string? status)
    {
        var task = GetById(id);
        if (task is null) return false;

        if (!string.IsNullOrWhiteSpace(title)) task.Title = title;
        if (description is not null) task.Description = description;
        if (!string.IsNullOrWhiteSpace(status)) task.Status = status;

        return true;
    }

    public bool DeleteTask(int id)
    {
        var task = GetById(id);
        if (task is null) return false;

        _tasks.Remove(task);
        return true;
    }
}