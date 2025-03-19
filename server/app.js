const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./models/index');
const http = require('http');                // <-- Add this
const socketIo = require('socket.io');         // <-- Add this

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files for the admin dashboard and employee tracker apps
app.use('/admin', express.static(path.join(__dirname, '../public/admin')));
app.use('/employee', express.static(path.join(__dirname, '../public/employee')));

// Create HTTP server and attach Socket.IO
const server = http.createServer(app);
const io = socketIo(server);

io.on('connection', (socket) => {
  console.log('A client connected: ' + socket.id);
});

// === Employee API endpoints ===

// Get all employees
app.get('/api/employees', async (req, res) => {
  try {
    const employees = await db.getAllEmployees();
    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create an employee profile
app.post('/api/employees', async (req, res) => {
  try {
    const employee = await db.createEmployee(req.body);
    io.emit('employeeUpdate', employee); // Emit update event if needed
    res.json(employee);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete an employee profile
app.delete('/api/employees/:id', async (req, res) => {
  try {
    await db.deleteEmployee(req.params.id);
    io.emit('employeeDeleted', req.params.id);
    res.json({ message: 'Employee deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === Attendance endpoints ===

// Employee clock in (server-side time and location validation)
app.post('/api/attendance/clockin', async (req, res) => {
  try {
    const { employeeId, location } = req.body;
    // Validate that a valid location is provided
    if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
      return res.status(400).json({ error: "Valid GPS location is required. Please ensure your GPS is turned on." });
    }
    const record = await db.clockIn(employeeId, location);
    io.emit('attendanceUpdate', record); // Emit real‑time attendance update
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Employee clock out (server-side time and location validation)
app.post('/api/attendance/clockout', async (req, res) => {
  try {
    const { employeeId, location } = req.body;
    // Validate that a valid location is provided
    if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
      return res.status(400).json({ error: "Valid GPS location is required. Please ensure your GPS is turned on." });
    }
    const record = await db.clockOut(employeeId, location);
    io.emit('attendanceUpdate', record); // Emit real‑time attendance update
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get attendance records
app.get('/api/attendance', async (req, res) => {
  try {
    const records = await db.getAttendanceRecords();
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === Authentication ===

// Employee login (created by admin dashboard)
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const employee = await db.authenticateEmployee(email, password);
    if (employee) {
      res.json(employee);
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === Location endpoints ===

// Update employee location
app.post('/api/locations/update', async (req, res) => {
  try {
    const { employeeId, latitude, longitude } = req.body;
    const result = await db.updateLocation(employeeId, latitude, longitude);
    io.emit('locationUpdate', result); // Emit real‑time location update
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all employee locations (for real‑time monitoring on admin map)
app.get('/api/locations', async (req, res) => {
  try {
    const locations = await db.getAllLocations();
    res.json(locations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start the server with Socket.IO integration
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
