const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3000;

// Middleware pour parser le JSON et permettre CORS
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Chemin du fichier JSON
const dataPath = path.join(__dirname, 'public', 'data', 'reports.json');

// Fonction pour lire les données
const readData = () => {
  try {
    const data = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Erreur lors de la lecture des données:', error);
    return { reports: [] };
  }
};

// Fonction pour écrire les données
const writeData = (data) => {
  try {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'écriture des données:', error);
    return false;
  }
};

// Récupérer tous les signalements
app.get('/api/reports', (req, res) => {
  const data = readData();
  res.json(data);
});

// Ajouter un nouveau signalement
app.post('/api/reports', (req, res) => {
  const data = readData();
  const newReport = req.body;
  
  // Générer un ID unique pour le signalement
  newReport.id = `GS-${String(data.reports.length + 1).padStart(3, '0')}`;
  newReport.date = new Date().toISOString();
  
  // Ajouter par défaut le statut "active" pour les nouveaux signalements
  if (!newReport.status) {
    newReport.status = 'active';
  }
  
  // Ajouter le nouveau signalement à la liste
  data.reports.unshift(newReport); // Ajouter au début pour qu'il apparaisse en premier
  
  if (writeData(data)) {
    res.status(201).json({
      success: true,
      report: newReport
    });
  } else {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'enregistrement du signalement'
    });
  }
});

// Mettre à jour le statut d'un signalement
app.patch('/api/reports/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  const data = readData();
  const reportIndex = data.reports.findIndex(report => report.id === id);
  
  if (reportIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Signalement non trouvé'
    });
  }
  
  data.reports[reportIndex].status = status;
  
  if (writeData(data)) {
    res.json({
      success: true,
      report: data.reports[reportIndex]
    });
  } else {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du signalement'
    });
  }
});

// Créer le dossier data s'il n'existe pas
const dataDir = path.join(__dirname, 'public', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialiser le fichier JSON s'il n'existe pas
if (!fs.existsSync(dataPath)) {
  const initialData = {
    reports: []
  };
  fs.writeFileSync(dataPath, JSON.stringify(initialData, null, 2), 'utf8');
}

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
  console.log(`Dashboard admin accessible sur http://localhost:${PORT}/admin/`);
});
