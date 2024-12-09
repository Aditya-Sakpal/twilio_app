const express = require('express');
const cors = require('cors'); 

require('dotenv').config();

const app = express();

app.use(cors()); 
app.use(express.json()); 

const callRoutes = require('./routes/callRoutes');

app.get('/', (req, res) => {
  res.send('Server running');
  res.send('Server running');
});

app.use('/api', callRoutes);

app.listen(3000, () => console.log('Server running on http://localhost:3000'));