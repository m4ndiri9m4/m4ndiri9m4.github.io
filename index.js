document.addEventListener('DOMContentLoaded', () => {
    loadEmployees();
    loadAttendance();
    initMap();
  
    document.getElementById('employee-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const employee = {
        id_no: document.getElementById('id_no').value,
        first_name: document.getElementById('first_name').value,
        last_name: document.getElementById('last_name').value,
        department: document.getElementById('department').value,
        position: document.getElementById('position').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        birth_date: document.getElementById('birth_date').value,
        date_hired: document.getElementById('date_hired').value
      };
  
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employee)
      });
      if (res.ok) {
        loadEmployees();
        document.getElementById('employee-form').reset();
      } else {
        alert('Error creating employee');
      }
    });

    // Set up Socket.IO for real‑time updates
    const socket = io();
    socket.on('attendanceUpdate', (data) => {
      loadAttendance();
    });
    socket.on('locationUpdate', (data) => {
      loadLocations();
    });
  });
  
  async function loadEmployees() {
    const res = await fetch('/api/employees');
    const employees = await res.json();
    const listDiv = document.getElementById('employee-list');
    listDiv.innerHTML = '';
    employees.forEach(emp => {
      const empDiv = document.createElement('div');
      empDiv.innerHTML = `${emp.id_no} - ${emp.first_name} ${emp.last_name} (${emp.department}, ${emp.position}) 
        <button onclick="deleteEmployee(${emp.id})">Delete</button>`;
      listDiv.appendChild(empDiv);
    });
  }
  
  async function deleteEmployee(id) {
    const res = await fetch(`/api/employees/${id}`, { method: 'DELETE' });
    if (res.ok) {
      loadEmployees();
    } else {
      alert('Error deleting employee');
    }
  }
  
  async function loadAttendance() {
    const res = await fetch('/api/attendance');
    const records = await res.json();
    const recordsDiv = document.getElementById('records');
    recordsDiv.innerHTML = '';
    records.forEach(rec => {
      // Convert clock times to readable format
      let clockInTime = rec.clock_in ? new Date(rec.clock_in).toLocaleString() : "N/A";
      let clockOutTime = rec.clock_out ? new Date(rec.clock_out).toLocaleString() : "N/A";

      // Build location strings if available
      let clockInLoc = rec.location_in && typeof rec.location_in.latitude === 'number' && typeof rec.location_in.longitude === 'number'
        ? ` (Lat: ${rec.location_in.latitude}, Lon: ${rec.location_in.longitude})`
        : '';
      let clockOutLoc = rec.location_out && typeof rec.location_out.latitude === 'number' && typeof rec.location_out.longitude === 'number'
        ? ` (Lat: ${rec.location_out.latitude}, Lon: ${rec.location_out.longitude})`
        : '';

      const recDiv = document.createElement('div');
      recDiv.innerHTML = `
        Employee ID: ${rec.employee} - 
        Clock In: ${clockInTime}${clockInLoc} - 
        Clock Out: ${clockOutTime}${clockOutLoc}
      `;
      recordsDiv.appendChild(recDiv);
    });
  }
  
  // Initialize Leaflet map (centered on the Philippines)
  let map;
  function initMap() {
    map = L.map('mapid').setView([12.8797, 121.7740], 6); // Philippines coordinates
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    loadLocations();
    setInterval(loadLocations, 5000); // Update every 5 seconds
  }
  
  async function loadLocations() {
    const res = await fetch('/api/locations');
    const locations = await res.json();
    // Remove existing markers
    map.eachLayer(function (layer) {
      if (layer.options && layer.options.pane === "markerPane") {
        map.removeLayer(layer);
      }
    });
    locations.forEach(loc => {
      L.marker([loc.latitude, loc.longitude]).addTo(map)
        .bindPopup("Employee ID: " + loc.employee_id);
    });
  }
