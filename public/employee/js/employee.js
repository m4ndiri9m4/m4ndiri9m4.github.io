let currentEmployee = null;
let map;

const socket = io();
socket.on('attendanceUpdate', (data) => {
  loadAttendance();
});
socket.on('locationUpdate', (data) => {
  // Optionally update your map view or any other UI elements here
});

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (res.ok) {
    currentEmployee = await res.json();
    document.getElementById('employee-name').innerText = currentEmployee.first_name;
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('tracker-section').style.display = 'block';
    initMap();
    loadAttendance();
  } else {
    alert('Login failed');
  }
});

document.getElementById('clockin-btn').addEventListener('click', async () => {
  if (!navigator.geolocation) {
    alert('Geolocation is not supported by your browser');
    return;
  }
  navigator.geolocation.getCurrentPosition(async (position) => {
    const location = { latitude: position.coords.latitude, longitude: position.coords.longitude };
    const res = await fetch('/api/attendance/clockin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId: currentEmployee.id, location })
    });
    if (res.ok) {
      updateLocation(location);
      loadAttendance();
      alert('Clocked in successfully');
    } else {
      alert('Error clocking in');
    }
  }, () => {
    alert('Please enable GPS to clock in.');
  });
});

document.getElementById('clockout-btn').addEventListener('click', async () => {
  if (!navigator.geolocation) {
    alert('Geolocation is not supported by your browser');
    return;
  }
  navigator.geolocation.getCurrentPosition(async (position) => {
    const location = { latitude: position.coords.latitude, longitude: position.coords.longitude };
    const res = await fetch('/api/attendance/clockout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId: currentEmployee.id, location })
    });
    if (res.ok) {
      updateLocation(location);
      loadAttendance();
      alert('Clocked out successfully');
    } else {
      alert('Error clocking out');
    }
  }, () => {
    alert('Please enable GPS to clock out.');
  });
});

function initMap() {
  // Default to a location in Metro Manila if no location is available
  map = L.map('mapid').setView([currentEmployee.latitude || 14.5995, currentEmployee.longitude || 120.9842], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);
}

async function updateLocation(location) {
  await fetch('/api/locations/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeId: currentEmployee.id, latitude: location.latitude, longitude: location.longitude })
  });
  // Add a marker to show current location
  L.marker([location.latitude, location.longitude]).addTo(map)
    .bindPopup("Your current location").openPopup();
}

async function loadAttendance() {
  const res = await fetch('/api/attendance');
  const records = await res.json();
  const historyDiv = document.getElementById('attendance-history');
  historyDiv.innerHTML = '<h3>Attendance History</h3>';
  records.filter(rec => rec.employee_id === currentEmployee.id).forEach(rec => {
    const recDiv = document.createElement('div');
    recDiv.innerHTML = `Clock In: ${rec.clock_in} - Clock Out: ${rec.clock_out || 'N/A'}`;
    historyDiv.appendChild(recDiv);
  });
}
