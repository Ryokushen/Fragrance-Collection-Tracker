import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Container, Typography, Box } from '@mui/material';

// Placeholder components - will be implemented in later tasks
const Dashboard = () => (
  <Box sx={{ py: 4 }}>
    <Typography variant="h4" component="h1" gutterBottom>
      Fragrance Collection Tracker
    </Typography>
    <Typography variant="body1" color="text.secondary">
      Welcome to your personal fragrance collection tracker. 
      Manage your collection, track inventory, and record daily wear.
    </Typography>
  </Box>
);

const Collection = () => (
  <Box sx={{ py: 4 }}>
    <Typography variant="h4" component="h1" gutterBottom>
      My Collection
    </Typography>
    <Typography variant="body1" color="text.secondary">
      Collection view will be implemented in later tasks.
    </Typography>
  </Box>
);

const Calendar = () => (
  <Box sx={{ py: 4 }}>
    <Typography variant="h4" component="h1" gutterBottom>
      Fragrance Calendar
    </Typography>
    <Typography variant="body1" color="text.secondary">
      Calendar view will be implemented in later tasks.
    </Typography>
  </Box>
);

function App() {
  return (
    <Container maxWidth="lg">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/collection" element={<Collection />} />
        <Route path="/calendar" element={<Calendar />} />
      </Routes>
    </Container>
  );
}

export default App;