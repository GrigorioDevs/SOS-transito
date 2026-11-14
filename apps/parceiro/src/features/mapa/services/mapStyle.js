// Aplicado apenas se VITE_GOOGLE_MAPS_MAP_ID não estiver configurado.
// Quando houver mapId, configure o tema escuro no Google Cloud Console.
export const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#20232b' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#191b23' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#a4a9b5' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#343845' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#e9ebf4' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#343844' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1c202b' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#b1b6c2' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#4a4c5b' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#242735' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#171b26' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#292c35' }] },
];
