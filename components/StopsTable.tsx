// components/StopsTable.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StopData } from '../types';

interface StopsTableProps {
  data: StopData[];
}

export default function StopsTable({ data }: StopsTableProps) {
  return (
    <View style={styles.table}>
      <View style={styles.headerRow}>
        <Text style={styles.headerCell}>Arrêt</Text>
        <Text style={styles.headerCell}>Montées</Text>
        <Text style={styles.headerCell}>Descentes</Text>
      </View>
      {data.map((stop, index) => (
        <View key={index} style={styles.row}>
          <Text style={styles.cell}>{stop.stopName}</Text>
          <Text style={styles.cell}>{stop.boardings}</Text>
          <Text style={styles.cell}>{stop.alightings}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  table: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingBottom: 4,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerCell: {
    flex: 1,
    fontWeight: 'bold',
  },
  cell: {
    flex: 1,
  },
});