import { Router } from "express"; // Import the Express Router used to define API endpoints.
import { auth } from "../helper/auth.js"; // Import the JWT authentication middleware.
import * as todoRepo from "../repository/todoRepository.js"; // Import the in-memory task repository.

const router = Router(); // Create a new router instance. All routes are attached to this object.

// --- GET / route (fetch all tasks) ---

// Handles HTTP GET requests to '/'.
// Returns the full list of tasks currently held in memory.
router.get("/", async (req, res, next) => {
  try {
    const tasks = await todoRepo.getAll();

    // Respond with HTTP 200 (OK) and the task array as JSON.
    res.status(200).json(tasks);
  } catch (err) {
    // Forward any unexpected error to Express's error-handling middleware (see app.js).
    next(err);
  }
});

// --- POST /create route (create a new task) ---

// Handles HTTP POST requests to '/create'.
// The 'auth' middleware runs first and verifies the JWT token before this handler executes.
router.post("/create", auth, async (req, res, next) => {
  try {
    const { task } = req.body;

    if (!task) {
      return res.status(400).json({ error: "Task is required" });
    }

    if (!task.description || task.description.length < 3) {
      return res.status(400).json({ error: "Description too short" });
    }

    const createdItem = await todoRepo.create(task.description);
    res.status(201).json(createdItem);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", auth, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const removedItem = await todoRepo.remove(id);

    if (!removedItem) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export { router };