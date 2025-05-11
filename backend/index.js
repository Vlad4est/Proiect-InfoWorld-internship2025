const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const clientRoutes = require('./routes/clientRoutes');
const carRoutes = require('./routes/carRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const serviceRecordRoutes = require('./routes/serviceRecordRoutes');
const partRoutes = require('./routes/partRoutes');

// Import middleware
const authMiddleware = require('./middleware/authMiddleware');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Log requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Routes publice
app.use('/api/auth', authRoutes);

// Routes protejate - necesită autentificare
app.use('/api/clients', authMiddleware.authenticate,  clientRoutes);
app.use('/api/cars', authMiddleware.authenticate, carRoutes);
app.use('/api/appointments', authMiddleware.authenticate, appointmentRoutes);

// Routes protejate - necesită autentificare și rol de admin sau tehnician
app.use('/api/service-records', 
  authMiddleware.authenticate, 
  authMiddleware.authorize('admin', 'tehnician'), 
  serviceRecordRoutes
);

// Routes protejate - necesită autentificare și rol de admin
// sau tehnician
// pentru a accesa piesele
app.use('/api/parts', 
  authMiddleware.authenticate, 
  authMiddleware.authorize('admin', 'tehnician'), 
  partRoutes
);

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Auto Service API', 
    version: '1.0.0',
    endpoints: [
      '/api/auth',
      '/api/clients',
      '/api/cars',
      '/api/appointments',
      '/api/service-records',
      '/api/parts'
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  
  res.status(statusCode).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
    validationErrors: err.validationErrors || undefined,
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;