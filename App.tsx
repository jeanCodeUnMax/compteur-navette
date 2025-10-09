// ==========================================
// VLX COMPTAGES - Application de comptage transport
// Version: 1.3.0 - avec support Web et Mobile
// Ligne Denain - Espace Villars
// ==========================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ScrollView,
  StatusBar,
  Platform
} from 'react-native';
import * as SQLite from 'expo-sqlite';
// Utiliser l'API legacy pour éviter les erreurs
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

// ==========================================
// EXPORTS - API Legacy corrigée
// ==========================================
const exporterBaseDeDonnees = async () => {
  if (!db) {
    Alert.alert('Info', 'Mode Web - Export SQLite non disponible');
    return;
  }
  try {
    // Utiliser FileSystem.documentDirectory au lieu de Paths
    const dbPath = `${FileSystem.documentDirectory}SQLite/${DB_NAME}`;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const exportPath = `${FileSystem.cacheDirectory}comptages_${timestamp}.db`;

    // Vérifier si le fichier existe
    const fileInfo = await FileSystem.getInfoAsync(dbPath);
    if (!fileInfo.exists) {
      Alert.alert('Erreur', 'Fichier base de données introuvable');
      return;
    }

    await FileSystem.copyAsync({ from: dbPath, to: exportPath });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(exportPath, {
        mimeType: 'application/x-sqlite3',
        dialogTitle: 'Exporter SQLite'
      });
      Alert.alert('Succès', 'Base exportée');
    } else {
      Alert.alert('Info', 'Partage non disponible');
    }
  } catch (err) {
    console.error('Erreur export DB:', err);
    Alert.alert('Erreur', `Export échoué: ${err.message}`);
  }
};

const exporterJSON = async () => {
  try {
    let data: any[] = [];

    // Collecter les données
    if (Platform.OS === 'web') {
      data = Array.from(memDB.entries()).map(([key, value]) => ({
        tour: parseInt(key.split('-')[0]),
        arretIndex: parseInt(key.split('-')[1]),
        arretNom: value.arretNom || ARRETS_BOUCLE[parseInt(key.split('-')[1])],
        montees: value.montees,
        descentes: value.descentes,
        dateHeure: value.dateHeure || new Date().toISOString(),
      }));
    } else if (db) {
      try {
        const st = db.prepareSync('SELECT * FROM comptages ORDER BY tour, arretIndex');
        const res = st.executeSync();
        data = res.getAllSync(); // Récupérer le premier résultat
        st.finalizeSync();
      } catch (dbError) {
        console.warn('Erreur SQLite, utilisation données mémoire:', dbError);
        data = Array.from(memDB.entries()).map(([key, value]) => ({
          tour: parseInt(key.split('-')[0]),
          arretIndex: parseInt(key.split('-')[1]),
          arretNom: value.arretNom || ARRETS_BOUCLE[parseInt(key.split('-')[1])],
          montees: value.montees,
          descentes: value.descentes,
          dateHeure: value.dateHeure || new Date().toISOString(),
        }));
      }
    } else {
      data = Array.from(memDB.entries()).map(([key, value]) => ({
        tour: parseInt(key.split('-')[0]),
        arretIndex: parseInt(key.split('-')[1]),
        arretNom: value.arretNom || ARRETS_BOUCLE[parseInt(key.split('-')[1])],
        montees: value.montees,
        descentes: value.descentes,
        dateHeure: value.dateHeure || new Date().toISOString(),
      }));
    }

    if (data.length === 0) {
      Alert.alert('Info', 'Aucune donnée à exporter');
      return;
    }

    const json = {
      meta: {
        export: new Date().toISOString(),
        total: data.length,
        platform: Platform.OS
      },
      comptages: data,
    };

    const fileName = `comptages_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)}.json`;
    const path = `${FileSystem.cacheDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(path, JSON.stringify(json, null, 2), { encoding: 'utf8' });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(path, {
        mimeType: 'application/json',
        dialogTitle: 'Exporter JSON'
      });
      Alert.alert('Succès', 'JSON exporté');
    } else {
      Alert.alert('Info', 'Partage non disponible');
    }
  } catch (e) {
    console.error('Erreur JSON:', e);
    Alert.alert('Erreur', `Export JSON échoué: ${e.message}`);
  }
};

const exporterCSV = async () => {
  try {
    let data: any[] = [];

    // Collecter les données
    if (Platform.OS === 'web') {
      data = Array.from(memDB.entries()).map(([key, value]) => ({
        tour: parseInt(key.split('-')[0]),
        arretIndex: parseInt(key.split('-')[1]),
        arretNom: value.arretNom || ARRETS_BOUCLE[parseInt(key.split('-')[1])],
        montees: value.montees,
        descentes: value.descentes,
        dateHeure: value.dateHeure || new Date().toISOString(),
      }));
    } else if (db) {
try {
        const st = db.prepareSync('SELECT * FROM comptages ORDER BY tour, arretIndex');
        const res = st.executeSync();
        data = res.getAllSync(); // Récupérer le premier résultat
        st.finalizeSync();
      } catch (dbError) {
        console.warn('Erreur SQLite, utilisation données mémoire:', dbError);
        data = Array.from(memDB.entries()).map(([key, value]) => ({
          tour: parseInt(key.split('-')[0]),
          arretIndex: parseInt(key.split('-')[1]),
          arretNom: value.arretNom || ARRETS_BOUCLE[parseInt(key.split('-')[1])],
          montees: value.montees,
          descentes: value.descentes,
          dateHeure: value.dateHeure || new Date().toISOString(),
        }));
      }
    } else {
      data = Array.from(memDB.entries()).map(([key, value]) => ({
        tour: parseInt(key.split('-')[0]),
        arretIndex: parseInt(key.split('-')[1]),
        arretNom: value.arretNom || ARRETS_BOUCLE[parseInt(key.split('-')[1])],
        montees: value.montees,
        descentes: value.descentes,
        dateHeure: value.dateHeure || new Date().toISOString(),
      }));
    }

    if (data.length === 0) {
      Alert.alert('Info', 'Aucune donnée à exporter');
      return;
    }

    const csv = [
      'Tour,Arrêt,Nom Arrêt,Montées,Descentes,Date/Heure',
      ...data.map(c => `${c.tour},${c.arretIndex},"${c.arretNom}",${c.montees},${c.descentes},"${c.dateHeure}"`)
    ].join('\n');

    const fileName = `comptages_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)}.csv`;
    const path = `${FileSystem.cacheDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(path, csv, { encoding: 'utf8' });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(path, {
        mimeType: 'text/csv',
        dialogTitle: 'Exporter CSV'
      });
      Alert.alert('Succès', 'CSV exporté');
    } else {
      Alert.alert('Info', 'Partage non disponible');
    }
  } catch (e) {
    console.error('Erreur CSV:', e);
    Alert.alert('Erreur', `Export CSV échoué: ${e.message}`);
  }
};

// ==========================================
// LISTE DES ARRÊTS (à l'intérieur d'Espace Villars)
// ==========================================
const ARRETS_BOUCLE = [
  'ESPACE VILLARS', 'TRARIEUX', 'LYCEES KASTLER', "RUE D'HAVELUY", 'DENAIN HOPITAL',
  'JAURES', 'GARE DU NORD', 'COLLEGE BAYARD', 'TURENNE', 'PLACE GAMBETTA',
  'MOUSSERON', 'PLACE BAUDIN', 'ETS DES FORGES', 'PARC ZOLA', 'PISCINE',
  "PONT DE L'ENCLOS", "PARC D'ACTIVITES", 'PARC LEBRET', 'ESPACE VILLARS'
];

// ==========================================
// MOCK HORAIRES (13 tours entrants/sortants d'Espace Villars)
// ==========================================
const MOCK_HORAIRES_VLX = [
  {
    tour: 1,
    depart: "Lille Flandres",
    HD: "07:35",
    arrivee: "Valenciennes",
    HA: "08:10",
    arrets: ["Lille Flandres", "Valenciennes"],
  },
  {
    tour: 2,
    depart: "Valenciennes",
    HD: "08:20",
    arrivee: "ESPACE VILLARS",
    HA: "08:49",
    arrets: ARRETS_BOUCLE,
  },
  // Génération des tours 3 à 13 (11 tours restants)
  ...Array.from({ length: 11 }, (_, i) => ({
    tour: i + 3,
    depart: "ESPACE VILLARS",
    HD: `${9 + i}:${i === 0 ? '00' : i === 1 ? '45' : i === 2 ? '30' : i === 3 ? '15' : i === 4 ? '00' : i === 5 ? '45' : i === 6 ? '30' : i === 7 ? '15' : i === 8 ? '00' : i === 9 ? '45' : '30'}`,
    arrivee: "ESPACE VILLARS",
    HA: `${9 + i}:${i === 0 ? '37' : i === 1 ? '22' : i === 2 ? '07' : i === 3 ? '52' : i === 4 ? '37' : i === 5 ? '22' : i === 6 ? '07' : i === 7 ? '52' : i === 8 ? '37' : i === 9 ? '22' : '07'}`,
    arrets: ARRETS_BOUCLE,
  })),
  {
    tour: 14,
    depart: "ESPACE VILLARS",
    HD: "18:43",
    arrivee: "Valenciennes",
    HA: "19:13",
    arrets: ["ESPACE VILLARS", "Valenciennes"],
  },
  {
    tour: 15,
    depart: "Valenciennes",
    HD: "19:20",
    arrivee: "Lille Flandres",
    HA: "19:55",
    arrets: ["Valenciennes", "Lille Flandres"],
  }
];

const NOMBRE_TOURS = MOCK_HORAIRES_VLX.length;
const DB_NAME = 'comptages.db';

// ==========================================
// INTERFACE
// ==========================================
interface Comptage {
  id?: number;
  tour: number;
  arretIndex: number;
  arretNom: string;
  montees: number;
  descentes: number;
  dateHeure: string;
}

// ==========================================
// BASE DE DONNÉES
// ==========================================
let db: SQLite.SQLiteDatabase | null = null;
const memDB = new Map<string, any>();

const initDatabase = (): boolean => {
  if (Platform.OS === 'web') {
    console.log('🧠 Mode WEB : base en mémoire');
    return true;
  }
  try {
    db = SQLite.openDatabaseSync(DB_NAME);
    db.execSync(`
      CREATE TABLE IF NOT EXISTS comptages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tour INTEGER,
        arretIndex INTEGER,
        arretNom TEXT,
        montees INTEGER,
        descentes INTEGER,
        dateHeure TEXT
      );
    `);
    return true;
  } catch (err) {
    console.error('Erreur DB init:', err);
    return false;
  }
};

// ==========================================
// EXPORTS - Fonctions déjà définies plus haut
// ==========================================
// Les fonctions exporterBaseDeDonnees, exporterJSON et exporterCSV
// sont déjà définies dans la section précédente du fichier
export default function App() {
  const [isDbReady, setIsDbReady] = useState(false);
  const [currentTour, setCurrentTour] = useState(1);
  const [currentArret, setCurrentArret] = useState(0);
  const [montees, setMontees] = useState(0);
  const [descentes, setDescentes] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    setIsDbReady(initDatabase());
  }, []);

  // Fonction pour changer le mode sombre
  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  const allerArretSuivant = () => {
    const infosTour = MOCK_HORAIRES_VLX[currentTour - 1];

    // Sauvegarder les comptages actuels
    const key = `${currentTour}-${currentArret}`;
    const comptage = {
      tour: currentTour,
      arretIndex: currentArret,
      arretNom: infosTour.arrets[currentArret],
      montees: montees,
      descentes: descentes,
      dateHeure: new Date().toISOString()
    };

    if (Platform.OS === 'web') {
      memDB.set(key, comptage);
    } else if (db) {
      try {
        const stmt = db.prepareSync('INSERT INTO comptages (tour, arretIndex, arretNom, montees, descentes, dateHeure) VALUES (?, ?, ?, ?, ?, ?)');
        stmt.executeSync([currentTour, currentArret, infosTour.arrets[currentArret], montees, descentes, new Date().toISOString()]);
        stmt.finalizeSync();
      } catch (err) {
        console.error('Erreur sauvegarde:', err);
        memDB.set(key, comptage);
      }
    } else {
      memDB.set(key, comptage);
    }

    // Réinitialiser les compteurs
    setMontees(0);
    setDescentes(0);

    // Passer à l'arrêt suivant
    if (currentArret < infosTour.arrets.length - 1) {
      setCurrentArret(currentArret + 1);
    } else {
      // Passer au tour suivant
      if (currentTour < NOMBRE_TOURS) {
        setCurrentTour(currentTour + 1);
        setCurrentArret(0);
      } else {
        Alert.alert('Terminé', 'Tous les tours sont complétés!');
      }
    }
  };

  const allerArretPrecedent = () => {
    let newTour = currentTour;
    let newArret = currentArret;

    if (currentArret > 0) {
      newArret = currentArret - 1;
    } else if (currentTour > 1) {
      newTour = currentTour - 1;
      newArret = MOCK_HORAIRES_VLX[newTour - 1].arrets.length - 1;
    }

    // Mise à jour de l'UI d'abord
    setCurrentTour(newTour);
    setCurrentArret(newArret);

    // Chargement des données synchrones
    const key = `${newTour}-${newArret}`;
    let data;

    if (Platform.OS === 'web') {
      data = memDB.get(key);
    } else if (db) {
      try {
        const st = db.prepareSync('SELECT * FROM comptages WHERE tour = ? AND arretIndex = ?');
        const res = st.executeSync([newTour, newArret]);
        const results = res.getAllSync();
        data = results.length > 0 ? results[0] : null;
        st.finalizeSync();
      } catch (e) {
        console.log('Aucune donnée en base pour', key);
        data = memDB.get(key);
      }
    }

    if (data) {
      setMontees(data.montees || 0);
      setDescentes(data.descentes || 0);
    } else {
      setMontees(0);
      setDescentes(0);
    }
  };

    // Chargement initial des données pour le premier arrêt
  useEffect(() => {
    const key = `${currentTour}-${currentArret}`;
    let data;

    if (Platform.OS === 'web') {
      data = memDB.get(key);
    } else if (db) {
      try {
        const st = db.prepareSync('SELECT * FROM comptages WHERE tour = ? AND arretIndex = ?');
        const res = st.executeSync([currentTour, currentArret]);
        const results = res.getAllSync();
        data = results.length > 0 ? results[0] : null;
        st.finalizeSync();
      } catch (e) {
        data = memDB.get(key);
      }
    }

    if (data) {
      setMontees(data.montees || 0);
      setDescentes(data.descentes || 0);
    }
  }, [currentTour, currentArret, db]); // Dépendances pour recharger quand l'arrêt change

  // STYLES DYNAMIQUES
  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#121212' : '#f5f5f5',
    },
    infoBox: {
      backgroundColor: isDarkMode ? '#1E1E1E' : '#fff',
      margin: 15,
      padding: 15,
      borderRadius: 10,
    },
    horairesBox: {
      backgroundColor: isDarkMode ? '#1E1E1E' : '#fff',
      margin: 15,
      padding: 15,
      borderRadius: 10,
    },
    arretBox: {
      backgroundColor: isDarkMode ? '#2E7D32' : '#4CAF50',
      margin: 15,
      padding: 25,
      borderRadius: 12,
      alignItems: 'center',
    },
    compteurSection: {
      backgroundColor: isDarkMode ? '#1E1E1E' : '#fff',
      margin: 15,
      padding: 20,
      borderRadius: 10,
    },
    text: {
      color: isDarkMode ? '#fff' : '#333',
    },
    textSecondary: {
      color: isDarkMode ? '#ccc' : '#666',
    },
  });

  // CALCULS
  const infosTour = MOCK_HORAIRES_VLX[currentTour - 1];
  const progression = (
    ((currentTour - 1) * infosTour.arrets.length + currentArret) /
    (NOMBRE_TOURS * infosTour.arrets.length) * 100
  );

  // RENDER
  if (!isDbReady) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.loadingText}>Initialisation...</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      <ScrollView style={dynamicStyles.container}>


        <View style={styles.header}>
          <Text style={[styles.title, dynamicStyles.text]}>VLX COMPTAGES</Text>
          <Text style={[styles.subtitle, dynamicStyles.textSecondary]}>Denain - Espace Villars</Text>
        </View>

        <View style={dynamicStyles.infoBox}>
          <Text style={dynamicStyles.text}>Tour {currentTour}/{NOMBRE_TOURS}</Text>
          <Text style={dynamicStyles.text}>Arrêt {currentArret + 1}/{infosTour.arrets.length}</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progression}%` }]} />
          </View>
          <Text style={[styles.progressText, dynamicStyles.textSecondary]}>{progression.toFixed(1)}%</Text>
        </View>

        <View style={dynamicStyles.horairesBox}>
          <Text style={[styles.horaireText, dynamicStyles.text]}>🕒 Départ tour : {infosTour.HD} ({infosTour.depart})</Text>
          <Text style={[styles.horaireText, dynamicStyles.text]}>🕓 Arrivée tour : {infosTour.HA} ({infosTour.arrivee})</Text>
        </View>

        <View style={dynamicStyles.arretBox}>
          <Text style={[styles.arretLabel, dynamicStyles.text]}>ARRÊT ACTUEL</Text>
          <Text style={[styles.arretNom, dynamicStyles.text]}>{infosTour.arrets[currentArret]}</Text>
        </View>

        <View style={dynamicStyles.compteurSection}>
          <Text style={[styles.sectionTitle, dynamicStyles.text]}>MONTER</Text>
          <View style={styles.counterRow}>
            <TouchableOpacity style={styles.btnCounter} onPress={() => setMontees(Math.max(0, montees - 1))}>
              <Text style={styles.btnCounterText}>−</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.counterInput}
              value={montees.toString()}
              onChangeText={v => {
                const newVal = Math.max(0, parseInt(v) || 0);
                setMontees(newVal);

                const key = `${currentTour}-${currentArret}`;
                memDB.set(key, {
                  ...memDB.get(key),
                  montees: newVal,
                  dateHeure: new Date().toISOString()
                });
              }}
              keyboardType="numeric"
            />
            <TouchableOpacity style={styles.btnCounter} onPress={() => setMontees(montees + 1)}>
              <Text style={styles.btnCounterText}>+</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 25 }, dynamicStyles.text]}>DESCENTE</Text>
          <View style={styles.counterRow}>
            <TouchableOpacity style={styles.btnCounter} onPress={() => setDescentes(Math.max(0, descentes - 1))}>
              <Text style={styles.btnCounterText}>−</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.counterInput}
              value={descentes.toString()}
              onChangeText={v => setDescentes(Math.max(0, parseInt(v) || 0))}
              keyboardType="numeric"
            />
            <TouchableOpacity style={styles.btnCounter} onPress={() => setDescentes(descentes + 1)}>
              <Text style={styles.btnCounterText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.navRow}>
          <TouchableOpacity
            style={[styles.btnNav, (currentArret === 0 && currentTour === 1) && styles.btnNavDisabled]}
            onPress={allerArretPrecedent}
            disabled={currentArret === 0 && currentTour === 1}>
            <Text style={styles.btnNavText}>← Précédent</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnNav} onPress={allerArretSuivant}>
            <Text style={styles.btnNavText}>Suivant →</Text>
          </TouchableOpacity>
        </View>

        {/* Bouton Mode Sombre discret */}
        <TouchableOpacity style={styles.btnExportSecondary} onPress={toggleDarkMode}>
          <Text style={styles.btnExportSecondaryText}>🌓 Mode Sombre</Text>
        </TouchableOpacity>

        <View style={styles.exportSection}>
          <TouchableOpacity style={styles.btnExport} onPress={exporterBaseDeDonnees}>
            <Text style={styles.btnExportText}>💾 Export SQLite</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnExportSecondary} onPress={exporterJSON}>
            <Text style={styles.btnExportSecondaryText}>📄 Export JSON</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnExportSecondary} onPress={exporterCSV}>
            <Text style={styles.btnExportSecondaryText}>📊 Export CSV</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}

// ==========================================
// STYLES
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 18, color: '#666' },
  header: { marginTop: 40, marginBottom: 20, alignItems: 'center' },
  title: { fontSize: 30, fontWeight: 'bold', color: '#2196F3' },
  subtitle: { fontSize: 14, color: '#555' },
  progressBar: { height: 10, backgroundColor: '#ddd', borderRadius: 5, marginTop: 10 },
  progressFill: { height: '100%', backgroundColor: '#4CAF50', borderRadius: 5 },
  progressText: { textAlign: 'center', color: '#666', marginTop: 5 },
  horaireText: { fontSize: 16, textAlign: 'center', marginVertical: 2 },
  arretLabel: { color: '#E8F5E9', fontSize: 12, fontWeight: 'bold' },
  arretNom: { color: '#fff', fontSize: 26, fontWeight: 'bold', marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2196F3', textAlign: 'center' },
  counterRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  btnCounter: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#2196F3', justifyContent: 'center', alignItems: 'center' },
  btnCounterText: { color: '#fff', fontSize: 30, fontWeight: 'bold' },
  counterInput: { width: 100, height: 60, borderWidth: 2, borderColor: '#2196F3', borderRadius: 8, textAlign: 'center', fontSize: 24, marginHorizontal: 10 },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', margin: 15 },
  btnNav: { flex: 1, backgroundColor: '#FF9800', padding: 15, marginHorizontal: 5, borderRadius: 10 },
  btnNavDisabled: { backgroundColor: '#BDBDBD' },
  btnNavText: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },
  exportSection: { margin: 15 },
  btnExport: { backgroundColor: '#2196F3', padding: 15, borderRadius: 10, marginVertical: 5 },
  btnExportText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
  btnExportSecondary: { backgroundColor: '#E0E0E0', padding: 15, borderRadius: 10, marginVertical: 5 },
  btnExportSecondaryText: { color: '#333', textAlign: 'center', fontWeight: 'bold' },
});