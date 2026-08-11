using TaskflowBackend.Models;
using TaskflowBackend.Services;

var builder = WebApplication.CreateBuilder(args);

// Register TaskService as a singleton — one shared instance for the whole app's lifetime,
// so every request reads/writes the same in-memory list instead of getting a fresh empty one.
builder.Services.AddSingleton<TaskService>();

// Allow the React frontend (running on a different port) to call this API
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();
app.UseCors("AllowFrontend");

// GET /api/tasks -> list all tasks
app.MapGet("/api/tasks", (TaskService service) =>
{
    return Results.Ok(service.GetAll());
});

// GET /api/tasks/{id} -> single task
app.MapGet("/api/tasks/{id:int}", (int id, TaskService service) =>
{
    var task = service.GetById(id);
    return task is not null ? Results.Ok(task) : Results.NotFound(new { error = "Task not found" });
});

// POST /api/tasks -> create a new task
app.MapPost("/api/tasks", (CreateTaskRequest request, TaskService service) =>
{
    if (string.IsNullOrWhiteSpace(request.Title))
    {
        return Results.BadRequest(new { error = "Title is required and cannot be empty." });
    }

    var task = service.AddTask(
        request.Title,
        request.Description ?? string.Empty,
        request.Status ?? "To Do"
    );

    return Results.Created($"/api/tasks/{task.Id}", task);
});

// PUT /api/tasks/{id} -> update an existing task
app.MapPut("/api/tasks/{id:int}", (int id, UpdateTaskRequest request, TaskService service) =>
{
    var updated = service.UpdateTask(id, request.Title, request.Description, request.Status);
    return updated ? Results.Ok(service.GetById(id)) : Results.NotFound(new { error = "Task not found" });
});

// DELETE /api/tasks/{id} -> remove a task
app.MapDelete("/api/tasks/{id:int}", (int id, TaskService service) =>
{
    var deleted = service.DeleteTask(id);
    return deleted ? Results.NoContent() : Results.NotFound(new { error = "Task not found" });
});

app.Run();

// Request "shapes" for incoming JSON — these define exactly what we expect
// the frontend to send us for create/update requests.
record CreateTaskRequest(string Title, string? Description, string? Status);
record UpdateTaskRequest(string? Title, string? Description, string? Status);