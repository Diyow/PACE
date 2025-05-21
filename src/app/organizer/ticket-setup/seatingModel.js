
// Section schema for seating layout
export const createDefaultSection = (id, name) => ({
  id,
  name,
  rows: 5,
  seatsPerRow: 10,
  startingSeatNumber: 1,
  pricing: {
    category: 'Standard',
    price: 50
  },
  coordinates: {
    x: 0,
    y: 0,
    rotation: 0
  }
});

// Default seating layout template based on the image
export const defaultTheaterLayout = [
  // Main sections (A-K)
  createDefaultSection('A', 'Orchestra A'),
  createDefaultSection('B', 'Orchestra B'),
  createDefaultSection('C', 'Orchestra C'),
  createDefaultSection('D', 'Orchestra D'),
  createDefaultSection('E', 'Orchestra E'),
  createDefaultSection('F', 'Orchestra F'),
  createDefaultSection('G', 'Orchestra G'),
  createDefaultSection('H', 'Orchestra H'),
  createDefaultSection('J', 'Orchestra J'),
  createDefaultSection('K', 'Orchestra K'),
  
  // Balcony sections (AA-EE)
  createDefaultSection('AA', 'Balcony AA'),
  createDefaultSection('BB', 'Balcony BB'),
  createDefaultSection('CC', 'Balcony CC'),
  createDefaultSection('DD', 'Balcony DD'),
  createDefaultSection('EE', 'Balcony EE')
];