const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Connect to MongoDB (update the URI if necessary)
mongoose.connect('mongodb://localhost/employee_tracker', { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
})
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// ====================
// Employee Schema
// ====================
const employeeSchema = new Schema({
  id_no: { type: String },
  first_name: { type: String },
  last_name: { type: String },
  email: { type: String, unique: true },
  password: { type: String },
  birth_date: { type: Date },
  department: { type: String },
  position: { type: String },
  date_hired: { type: Date }
});
const Employee = mongoose.model('Employee', employeeSchema);

// ====================
// Attendance Schema
// ====================
const attendanceSchema = new Schema({
  employee: { type: Schema.Types.ObjectId, ref: 'Employee' },
  clock_in: { type: Date },
  clock_out: { type: Date, default: null },
  location_in: {
    latitude: { type: Number },
    longitude: { type: Number }
  },
  location_out: {
    latitude: { type: Number },
    longitude: { type: Number }
  }
});
const Attendance = mongoose.model('Attendance', attendanceSchema);

// ====================
// Location Schema
// ====================
const locationSchema = new Schema({
  employee: { type: Schema.Types.ObjectId, ref: 'Employee', unique: true },
  latitude: { type: Number },
  longitude: { type: Number },
  updated_at: { type: Date }
});
const Location = mongoose.model('Location', locationSchema);

// ====================
// Database Functions
// ====================

// Function: Get all employees
function getAllEmployees() {
  return Employee.find().exec();
}

// Function: Create an employee
function createEmployee(employeeData) {
  const employee = new Employee({
    id_no: employeeData.id_no,
    first_name: employeeData.first_name,
    last_name: employeeData.last_name,
    email: employeeData.email,
    password: employeeData.password,
    birth_date: employeeData.birth_date,
    department: employeeData.department,
    position: employeeData.position,
    date_hired: employeeData.date_hired
  });
  return employee.save();
}

// Function: Delete an employee
function deleteEmployee(id) {
  return Employee.findByIdAndDelete(id).exec();
}

// Function: Clock in an employee (server-side timestamp)
function clockIn(employeeId, location) {
  const clockInTime = new Date();
  const attendance = new Attendance({
    employee: employeeId,
    clock_in: clockInTime,
    location_in: location
  });
  return attendance.save();
}

// Function: Clock out an employee (server-side timestamp)
// It updates the latest attendance record that hasn't been clocked out
async function clockOut(employeeId, location) {
  const clockOutTime = new Date();
  const attendanceRecord = await Attendance.findOne({ employee: employeeId, clock_out: null }).sort({ clock_in: -1 }).exec();
  if (!attendanceRecord) {
    throw new Error("No active clock‑in record found");
  }
  attendanceRecord.clock_out = clockOutTime;
  attendanceRecord.location_out = location;
  return attendanceRecord.save();
}

// Function: Get all attendance records
function getAttendanceRecords() {
  return Attendance.find().exec();
}

// Function: Update employee location (for real‑time tracking)
function updateLocation(employeeId, latitude, longitude) {
  const updatedAt = new Date();
  return Location.findOneAndUpdate(
    { employee: employeeId },
    { latitude, longitude, updated_at: updatedAt },
    { new: true, upsert: true }
  ).exec();
}

// Function: Get all employee locations
function getAllLocations() {
  return Location.find().exec();
}

// Function: Authenticate employee login
function authenticateEmployee(email, password) {
  return Employee.findOne({ email, password }).exec();
}

module.exports = {
  getAllEmployees,
  createEmployee,
  deleteEmployee,
  clockIn,
  clockOut,
  getAttendanceRecords,
  updateLocation,
  getAllLocations,
  authenticateEmployee
};
