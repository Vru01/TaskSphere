const express = require('express');
const mongoose = require('mongoose');
const amqp = require('amqplib');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/notificationService', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Notification Schema
const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['task_assigned', 'task_updated', 'task_deleted'], required: true },
  read: { type: Boolean, default: false },
  taskId: { type: mongoose.Schema.Types.ObjectId },
  metadata: { type: Object }
}, { timestamps: true });

const Notification = mongoose.model('Notification', notificationSchema);

// RabbitMQ connection and message consumption
async function connectRabbitMQ() {
  try {
    const connection = await amqp.connect('amqp://localhost:5672');
    const channel = await connection.createChannel();
    
    await channel.assertQueue('TASK_CREATED');
    await channel.assertQueue('TASK_UPDATED');
    await channel.assertQueue('TASK_DELETED');

    console.log('Notification Service connected to RabbitMQ');

    // Consume messages
    channel.consume('TASK_CREATED', async (msg) => {
      if (msg !== null) {
        const data = JSON.parse(msg.content.toString());
        await createNotification({
          userId: data.assignedTo,
          message: `New task assigned: "${data.title}" by ${data.assignedByName}`,
          type: 'task_assigned',
          taskId: data.taskId,
          metadata: data
        });
        channel.ack(msg);
      }
    });

    channel.consume('TASK_UPDATED', async (msg) => {
      if (msg !== null) {
        const data = JSON.parse(msg.content.toString());
        await createNotification({
          userId: data.assignedTo,
          message: `Task "${data.title}" status updated to ${data.status}`,
          type: 'task_updated',
          taskId: data.taskId,
          metadata: data
        });
        channel.ack(msg);
      }
    });

    channel.consume('TASK_DELETED', async (msg) => {
      if (msg !== null) {
        const data = JSON.parse(msg.content.toString());
        await createNotification({
          userId: data.assignedTo,
          message: `Task "${data.title}" has been deleted by ${data.assignedByName}`,
          type: 'task_deleted',
          taskId: data.taskId,
          metadata: data
        });
        channel.ack(msg);
      }
    });

  } catch (error) {
    console.error('RabbitMQ connection error:', error);
    setTimeout(connectRabbitMQ, 5000);
  }
}

async function createNotification(notificationData) {
  try {
    const notification = new Notification(notificationData);
    await notification.save();
    console.log('Notification created:', notification.message);
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}

// Routes
app.get('/notifications/:userId', async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.params.userId })
      .sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.put('/notifications/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    res.json({ message: 'Notification marked as read', notification });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.put('/notifications/user/:userId/read-all', async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.params.userId, read: false },
      { read: true }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Notification Service is running' });
});

const PORT = process.env.PORT || 5003;
app.listen(PORT, async () => {
  console.log(`Notification Service running on port ${PORT}`);
  await connectRabbitMQ();
});