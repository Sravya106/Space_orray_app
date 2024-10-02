const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// JPL API Endpoints
const JPL_FIREBALL_API = 'https://ssd-api.jpl.nasa.gov/fireball.api';
const JPL_HORIZONS_API = 'https://ssd.jpl.nasa.gov/api/horizons.api';
const JPL_SBDB_API = 'https://ssd-api.jpl.nasa.gov/sbdb.api';

// Route to fetch Fireball Data
app.get('/api/fireball', async (req, res) => {
  try {
    const response = await axios.get(`${JPL_FIREBALL_API}?limit=10`);  // Adjust limit as necessary
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching fireball data from JPL API', error: error.message });
  }
});

// Route to fetch Small Body Database Data
app.get('/api/sbdb', async (req, res) => {
  try {
    const response = await axios.get(`${JPL_SBDB_API}?sstr=433`); // Use 433 for Eros as an example
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching small body data from JPL API', error: error.message });
  }
});

// Route to fetch Horizons data
app.get('/api/horizons', async (req, res) => {
  try {
    const params = {
      id: '433',  // The ID for Eros
      epochs: '2023-01-01',  // Replace with the desired epoch
      format: 'json',  // Request JSON format
    };

    // Sending parameters as part of the request body
    const response = await axios.post(JPL_HORIZONS_API, params);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching Horizons data from JPL API', error: error.message });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


