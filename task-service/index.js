const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const amqp = require('amqplib');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/taskService', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Task Schema
const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, required: true },
  assignedToName: { type: String, required: true },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, required: true },
  assignedByName: { type: String, required: true },
  status: { type: String, enum: ['pending', 'in progress', 'completed'], default: 'pending' },
  dueDate: { type: Date },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
}, { timestamps: true });

const Task = mongoose.model('Task', taskSchema);

// RabbitMQ connection
let channel, connection;
async function connectRabbitMQ() {
  try {
    connection = await amqp.connect('amqp://localhost:5672');
    channel = await connection.createChannel();
    await channel.assertQueue('TASK_CREATED');
    await channel.assertQueue('TASK_UPDATED');
    await channel.assertQueue('TASK_DELETED');
    console.log('Task Service connected to RabbitMQ');
  } catch (error) {
    console.error('RabbitMQ connection error:', error);
    setTimeout(connectRabbitMQ, 5000);
  }
}

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, 'your_jwt_secret_key', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Routes
app.post('/tasks', authenticateToken, async (req, res) => {
  try {
    const { title, description, assignedTo, assignedToName, dueDate, priority } = req.body;

    const task = new Task({
      title,
      description,
      assignedTo,
      assignedToName,
      assignedBy: req.user.userId,
      assignedByName: req.user.name,
      dueDate,
      priority
    });

    await task.save();

    // Send notification via RabbitMQ
    if (channel) {
      channel.sendToQueue('TASK_CREATED', Buffer.from(JSON.stringify({
        taskId: task._id,
        title: task.title,
        assignedTo: task.assignedTo,
        assignedByName: task.assignedByName,
        type: 'task_assigned'
      })));
    }

    res.status(201).json({ message: 'Task created successfully', task });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/tasks', authenticateToken, async (req, res) => {
  try {
    let tasks;
    if (req.user.role === 'manager') {
      tasks = await Task.find().sort({ createdAt: -1 });
    } else {
      tasks = await Task.find({ assignedTo: req.user.userId }).sort({ createdAt: -1 });
    }
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.put('/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check permissions
    if (req.user.role === 'employee' && task.assignedTo.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updateData = req.user.role === 'manager' ? req.body : 
      { status: req.body.status }; // Employees can only update status

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    // Send notification via RabbitMQ
    if (channel) {
      channel.sendToQueue('TASK_UPDATED', Buffer.from(JSON.stringify({
        taskId: updatedTask._id,
        title: updatedTask.title,
        assignedTo: updatedTask.assignedTo,
        status: updatedTask.status,
        type: 'task_updated'
      })));
    }

    res.json({ message: 'Task updated successfully', task: updatedTask });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.delete('/tasks/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Only managers can delete tasks' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Send notification before deletion
    if (channel) {
      channel.sendToQueue('TASK_DELETED', Buffer.from(JSON.stringify({
        taskId: task._id,
        title: task.title,
        assignedTo: task.assignedTo,
        assignedByName: task.assignedByName,
        type: 'task_deleted'
      })));
    }

    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Task Service is running' });
});

const PORT = process.env.PORT || 5002;
app.listen(PORT, async () => {
  console.log(`Task Service running on port ${PORT}`);
  await connectRabbitMQ();
});