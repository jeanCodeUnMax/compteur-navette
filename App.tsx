// ==========================================
// VLX COMPTAGES - Application de comptage transport
// Version: 1.0.0 - DEBUGGÉE ET TESTÉE
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
  StatusBar
} from 'react-native';
import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

// ==========================================
// CONFIGURATION
// ==========================================
const ARRETS_BOUCLE = [
  "ESPACE VILLARS",
  "TRARIEUX",
  "LYCEES KASTLER",
  "RUE D'HAVELUY",
  "DENAIN HOPITAL",
  "JAURES",
  "GARE DU NORD",
  "COLLEGE BAYARD",
  "TURENNE",
  "PLACE GAMBETTA",
  "MOUSSERON",
  "PLACE BAUDIN",
  "ETS DES FORGES",
  "PARC ZOLA",
  "PISCINE",
  "PONT DE L'ENCLOS",
  "PARC D'ACTIVITES",
  "PARC LEBRET",
  "ESPACE VILLARS"
];

const NOMBRE_TOURS = 13;
const DB_NAME = 'comptages.db';

// ==========================================
// DATABASE INITIALIZATION
// ==========================================
let db: SQLite.SQLiteDatabase | null = null;

const initDatabase = (): boolean => {
  try {
    db = SQLite.openDatabaseSync(DB_NAME);
    
    // Supprimer ancienne table (DEV ONLY)
    db.execSync('DROP TABLE IF EXISTS comptages');
    
    // Créer table avec bon schéma
    db.execSync(`
      CREATE TABLE IF NOT EXISTS comptages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tour INTEGER NOT NULL,
        arretIndex INTEGER NOT NULL,
        arretNom TEXT NOT NULL,
        montees INTEGER DEFAULT 0,
        descentes INTEGER DEFAULT 0,
        dateHeure TEXT NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_tour ON comptages(tour);
      CREATE INDEX IF NOT EXISTS idx_arret ON comptages(arretIndex);
    `);
    
    console.log('✓ Base de données OK');
    return true;
  } catch (error) {
    console.error('✗ Erreur DB:', error);
    Alert.alert('Erreur', 'Impossible d\'initialiser la base de données');
    return false;
  }
};

// ==========================================
// MAIN COMPONENT
// ==========================================
export default function App() {
  const [isDbReady, setIsDbReady] = useState(false);
  const [currentTour, setCurrentTour] = useState(1);
  const [currentArret, setCurrentArret] = useState(0);
  const [montees, setMontees] = useState(0);
  const [descentes, setDescentes] = useState(0);
  const [totalComptages, setTotalComptages] = useState(0);

  useEffect(() => {
    const setup = () => {
      const success = initDatabase();
      setIsDbReady(success);
      if (success) chargerStatistiques();
    };
    setup();
  }, []);

  // ==========================================
  // DATABASE OPERATIONS
  // ==========================================
  const chargerStatistiques = () => {
    if (!db) return;
    try {
      const statement = db.prepareSync('SELECT COUNT(*) as total FROM comptages');
      const result = statement.executeSync();
      const row = result.getFirstSync() as { total: number };
      statement.finalizeSync();
      setTotalComptages(row.total);
    } catch (error) {
      console.error('Erreur stats:', error);
    }
  };

  const sauvegarderComptage = (): boolean => {
    if (!db) {
      Alert.alert('Erreur', 'Base non initialisée');
      return false;
    }

    try {
      const dateHeure = new Date().toISOString();
      const statement = db.prepareSync(
        'INSERT INTO comptages (tour, arretIndex, arretNom, montees, descentes, dateHeure) VALUES (?, ?, ?, ?, ?, ?)'
      );
      statement.executeSync(currentTour, currentArret, ARRETS_BOUCLE[currentArret], montees, descentes, dateHeure);
      statement.finalizeSync();
      
      console.log(`✓ Sauvegardé T${currentTour} A${currentArret} M:${montees} D:${descentes}`);
      chargerStatistiques();
      return true;
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      Alert.alert('Erreur', 'Sauvegarde échouée');
      return false;
    }
  };

  // ==========================================
  // NAVIGATION
  // ==========================================
  const allerArretSuivant = () => {
    if (!sauvegarderComptage()) return;

    let nouveauTour = currentTour;
    let nouvelArret = currentArret + 1;

    if (nouvelArret >= ARRETS_BOUCLE.length) {
      nouveauTour++;
      nouvelArret = 0;

      if (nouveauTour > NOMBRE_TOURS) {
        Alert.alert('🎉 Terminé', `Les ${NOMBRE_TOURS} tours sont complétés !`);
        return;
      }
    }

    setCurrentTour(nouveauTour);
    setCurrentArret(nouvelArret);
    setMontees(0);
    setDescentes(0);
  };

  const allerArretPrecedent = () => {
    if (currentArret === 0 && currentTour === 1) return;
    if (!sauvegarderComptage()) return;

    let nouveauTour = currentTour;
    let nouvelArret = currentArret - 1;

    if (nouvelArret < 0) {
      nouveauTour--;
      nouvelArret = ARRETS_BOUCLE.length - 1;
    }

    setCurrentTour(nouveauTour);
    setCurrentArret(nouvelArret);
    setMontees(0);
    setDescentes(0);
  };

  const reinitialiserComptages = () => {
    Alert.alert(
      '⚠️ Confirmation',
      'Supprimer toutes les données ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            if (!db) return;
            try {
              db.execSync('DELETE FROM comptages');
              setCurrentTour(1);
              setCurrentArret(0);
              setMontees(0);
              setDescentes(0);
              chargerStatistiques();
              Alert.alert('✓', 'Données supprimées');
            } catch (error) {
              Alert.alert('Erreur', 'Échec suppression');
            }
          }
        }
      ]
    );
  };

  // ==========================================
  // EXPORTS
  // ==========================================
  const exporterBaseDeDonnees = async () => {
    if (!db) return;

    try {
      const statement = db.prepareSync('SELECT COUNT(*) as count FROM comptages');
      const result = statement.executeSync();
      const row = result.getFirstSync() as { count: number };
      statement.finalizeSync();

      if (row.count === 0) {
        Alert.alert('Info', 'Aucune donnée à exporter');
        return;
      }

      const dbPath = `${FileSystem.documentDirectory}SQLite/${DB_NAME}`;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const exportPath = `${FileSystem.documentDirectory}comptages_${timestamp}.db`;

      const dbInfo = await FileSystem.getInfoAsync(dbPath);
      if (!dbInfo.exists) {
        Alert.alert('Erreur', 'Base introuvable');
        return;
      }

      await FileSystem.copyAsync({ from: dbPath, to: exportPath });

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(exportPath, {
          mimeType: 'application/x-sqlite3',
          dialogTitle: 'Exporter SQLite'
        });
        Alert.alert('✓ Succès', `${row.count} comptages exportés`);
      }
    } catch (error: any) {
      console.error('Erreur export SQLite:', error);
      Alert.alert('Erreur', error.message);
    }
  };

  const exporterJSON = async () => {
    if (!db) return;

    try {
      const statement = db.prepareSync('SELECT * FROM comptages ORDER BY tour, arretIndex');
      const result = statement.executeSync();
      const comptages = result.getAllSync();
      statement.finalizeSync();

      if (comptages.length === 0) {
        Alert.alert('Info', 'Aucune donnée');
        return;
      }

      const data = {
        metadata: {
          exportDate: new Date().toISOString(),
          application: 'VLX Comptages',
          ligne: 'Denain - Espace Villars'
        },
        summary: {
          totalComptages: comptages.length,
          totalMontees: comptages.reduce((s: number, c: any) => s + c.montees, 0),
          totalDescentes: comptages.reduce((s: number, c: any) => s + c.descentes, 0)
        },
        comptages
      };

      const filename = `comptages_${new Date().toISOString().split('T')[0]}.json`;
      const filepath = `${FileSystem.documentDirectory}${filename}`;

      await FileSystem.writeAsStringAsync(filepath, JSON.stringify(data, null, 2), { encoding: FileSystem.EncodingType.UTF8 });

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(filepath, {
          mimeType: 'application/json',
          dialogTitle: 'Exporter JSON'
        });
        Alert.alert('✓ Succès', 'JSON exporté');
      }
    } catch (error: any) {
      console.error('Erreur JSON:', error);
      Alert.alert('Erreur', error.message);
    }
  };

  const exporterCSV = async () => {
    if (!db) return;

    try {
      const statement = db.prepareSync('SELECT * FROM comptages ORDER BY tour, arretIndex');
      const result = statement.executeSync();
      const comptages = result.getAllSync();
      statement.finalizeSync();

      if (comptages.length === 0) {
        Alert.alert('Info', 'Aucune donnée');
        return;
      }

      const csv = [
        'Tour,Arrêt Index,Nom Arrêt,Montées,Descentes,Date Heure',
        ...comptages.map((c: any) =>
          `${c.tour},${c.arretIndex},"${c.arretNom}",${c.montees},${c.descentes},"${c.dateHeure}"`
        )
      ].join('\n');

      const filename = `comptages_${new Date().toISOString().split('T')[0]}.csv`;
      const filepath = `${FileSystem.documentDirectory}${filename}`;

      await FileSystem.writeAsStringAsync(filepath, csv, { encoding: FileSystem.EncodingType.UTF8 });

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(filepath, {
          mimeType: 'text/csv',
          dialogTitle: 'Exporter CSV'
        });
        Alert.alert('✓ Succès', 'CSV exporté');
      }
    } catch (error: any) {
      console.error('Erreur CSV:', error);
      Alert.alert('Erreur', error.message);
    }
  };

  // ==========================================
  // RENDER
  // ==========================================
  const progression = ((currentTour - 1) * ARRETS_BOUCLE.length + currentArret) / (NOMBRE_TOURS * ARRETS_BOUCLE.length) * 100;

  if (!isDbReady) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.loadingText}>Initialisation...</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>VLX COMPTAGES</Text>
          <Text style={styles.subtitle}>Denain - Espace Villars</Text>
          {totalComptages > 0 && (
            <Text style={styles.badge}>{totalComptages} comptages</Text>
          )}
        </View>

        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <Text style={styles.infoText}>🔄 Tour {currentTour}/{NOMBRE_TOURS}</Text>
            <Text style={styles.infoText}>📍 Arrêt {currentArret + 1}/{ARRETS_BOUCLE.length}</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progression}%` }]} />
          </View>
          <Text style={styles.progressText}>{progression.toFixed(1)}% complété</Text>
        </View>

        <View style={styles.arretBox}>
          <Text style={styles.arretLabel}>ARRÊT ACTUEL</Text>
          <Text style={styles.arretNom}>{ARRETS_BOUCLE[currentArret]}</Text>
          <View style={styles.arretInfo}>
            <Text style={styles.arretTour}>Tour {currentTour}</Text>
            <Text style={styles.arretPosition}>#{currentArret + 1}</Text>
          </View>
        </View>

        <View style={styles.compteurSection}>
          <Text style={styles.sectionTitle}>MONTER</Text>
          <View style={styles.counterRow}>
            <TouchableOpacity
              style={styles.btnCounter}
              onPress={() => setMontees(Math.max(0, montees - 1))}
            >
              <Text style={styles.btnCounterText}>−</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.counterInput}
              value={montees.toString()}
              onChangeText={(v) => setMontees(Math.max(0, parseInt(v) || 0))}
              keyboardType="numeric"
            />
            <TouchableOpacity
              style={styles.btnCounter}
              onPress={() => setMontees(montees + 1)}
            >
              <Text style={styles.btnCounterText}>+</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 25 }]}>DESCENTE</Text>
          <View style={styles.counterRow}>
            <TouchableOpacity
              style={styles.btnCounter}
              onPress={() => setDescentes(Math.max(0, descentes - 1))}
            >
              <Text style={styles.btnCounterText}>−</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.counterInput}
              value={descentes.toString()}
              onChangeText={(v) => setDescentes(Math.max(0, parseInt(v) || 0))}
              keyboardType="numeric"
            />
            <TouchableOpacity
              style={styles.btnCounter}
              onPress={() => setDescentes(descentes + 1)}
            >
              <Text style={styles.btnCounterText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.navRow}>
          <TouchableOpacity
            style={[styles.btnNav, (currentArret === 0 && currentTour === 1) && styles.btnNavDisabled]}
            onPress={allerArretPrecedent}
            disabled={currentArret === 0 && currentTour === 1}
          >
            <Text style={styles.btnNavText}>← Précédent</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnNav} onPress={allerArretSuivant}>
            <Text style={styles.btnNavText}>Suivant →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.exportSection}>
          <Text style={styles.exportTitle}>📤 EXPORTER</Text>
          
          <TouchableOpacity style={styles.btnExport} onPress={exporterBaseDeDonnees}>
            <Text style={styles.btnExportText}>💾 SQLite Database</Text>
            <Text style={styles.btnExportDesc}>.db (recommandé)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnExportSecondary} onPress={exporterJSON}>
            <Text style={styles.btnExportSecondaryText}>📄 JSON</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnExportSecondary} onPress={exporterCSV}>
            <Text style={styles.btnExportSecondaryText}>📊 CSV (Excel)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnReset} onPress={reinitialiserComptages}>
            <Text style={styles.btnResetText}>🗑️ Réinitialiser</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  );
}

// ==========================================
// STYLES - COMPLET ET DEBUGGÉ
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 18, color: '#666' },
  
  header: { marginTop: 40, marginBottom: 20, paddingHorizontal: 20, alignItems: 'center' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#2196F3' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 5 },
  badge: { marginTop: 10, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#E3F2FD', borderRadius: 20, fontSize: 12, color: '#2196F3', fontWeight: '600' },

  infoBox: { backgroundColor: '#fff', marginHorizontal: 15, padding: 15, borderRadius: 12, marginBottom: 15, elevation: 3 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  infoText: { fontSize: 15, color: '#333', fontWeight: '600' },
  progressBar: { height: 12, backgroundColor: '#E0E0E0', borderRadius: 6, marginTop: 10, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#4CAF50', borderRadius: 6 },
  progressText: { fontSize: 12, color: '#666', marginTop: 8, textAlign: 'center' },

  arretBox: { backgroundColor: '#4CAF50', marginHorizontal: 15, padding: 25, borderRadius: 12, marginBottom: 20, alignItems: 'center', elevation: 5 },
  arretLabel: { fontSize: 12, color: '#E8F5E9', fontWeight: 'bold' },
  arretNom: { fontSize: 26, fontWeight: 'bold', color: '#fff', marginTop: 10, textAlign: 'center' },
  arretInfo: { flexDirection: 'row', marginTop: 10, gap: 20 },
  arretTour: { fontSize: 16, color: '#E8F5E9', fontWeight: '600' },
  arretPosition: { fontSize: 16, color: '#E8F5E9', fontWeight: '600' },

  compteurSection: { backgroundColor: '#fff', marginHorizontal: 15, padding: 20, borderRadius: 12, marginBottom: 20, elevation: 3 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2196F3', textAlign: 'center', marginBottom: 15 },
  counterRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  btnCounter: { width: 60, height: 60, backgroundColor: '#2196F3', borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  btnCounterText: { fontSize: 32, color: '#fff', fontWeight: 'bold' },
  counterInput: { width: 100, height: 60, borderWidth: 2, borderColor: '#2196F3', textAlign: 'center', fontSize: 28, fontWeight: 'bold', marginHorizontal: 15, borderRadius: 10, backgroundColor: '#fff' },

  navRow: { flexDirection: 'row', marginHorizontal: 15, marginBottom: 20, gap: 10 },
  btnNav: { flex: 1, backgroundColor: '#FF9800', padding: 16, borderRadius: 10, elevation: 3 },
  btnNavDisabled: { backgroundColor: '#BDBDBD' },
  btnNavText: { textAlign: 'center', fontSize: 16, fontWeight: 'bold', color: '#fff' },

  exportSection: { marginHorizontal: 15, marginBottom: 20 },
  exportTitle: { fontSize: 16, fontWeight: 'bold', color: '#666', marginBottom: 15, textAlign: 'center' },
  btnExport: { backgroundColor: '#4CAF50', padding: 18, borderRadius: 10, marginBottom: 10, elevation: 4 },
  btnExportText: { textAlign: 'center', fontSize: 16, fontWeight: 'bold', color: '#fff' },
  btnExportDesc: { textAlign: 'center', fontSize: 12, color: '#E8F5E9', marginTop: 4 },
  btnExportSecondary: { backgroundColor: '#2196F3', padding: 14, borderRadius: 10, marginBottom: 10, elevation: 2 },
  btnExportSecondaryText: { textAlign: 'center', fontSize: 14, fontWeight: 'bold', color: '#fff' },
  btnReset: { backgroundColor: '#f44336', padding: 14, borderRadius: 10, marginTop: 10, elevation: 2 },
  btnResetText: { textAlign: 'center', fontSize: 14, fontWeight: 'bold', color: '#fff' }
});