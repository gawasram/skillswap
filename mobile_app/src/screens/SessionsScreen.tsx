import React, { useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Card, Button, Chip, Searchbar, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

// Placeholder session data
const SESSIONS = [
  {
    id: '1',
    title: 'Introduction to React Native',
    mentor: 'Alice Johnson',
    startTime: '2023-05-15T15:00:00',
    status: 'confirmed',
    isOnline: true,
  },
  {
    id: '2',
    title: 'Advanced JavaScript Patterns',
    mentor: 'Bob Smith',
    startTime: '2023-05-16T10:30:00',
    status: 'pending',
    isOnline: true,
  },
  {
    id: '3',
    title: 'UI/UX Design Fundamentals',
    mentor: 'Carol Davis',
    startTime: '2023-05-17T14:00:00',
    status: 'confirmed',
    isOnline: false,
  },
];

const SessionsScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('upcoming');

  const onChangeSearch = (query: string) => setSearchQuery(query);

  const renderSessionItem = ({ item }: { item: any }) => {
    // Convert date string to readable format
    const date = new Date(item.startTime);
    const formattedDate = `${date.toLocaleDateString()} • ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    return (
      <Card style={styles.sessionCard}>
        <Card.Content>
          <View style={styles.sessionHeader}>
            <Text style={styles.sessionDate}>{formattedDate}</Text>
            <Chip 
              mode="outlined"
              style={[
                styles.statusChip, 
                item.status === 'confirmed' ? styles.confirmedChip : styles.pendingChip
              ]}
            >
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Chip>
          </View>
          <Text style={styles.sessionTitle}>{item.title}</Text>
          <Text style={styles.mentorName}>with {item.mentor}</Text>
          <Text style={styles.sessionType}>{item.isOnline ? '🌐 Online' : '📍 In Person'}</Text>
        </Card.Content>
        <Card.Actions>
          <Button>Details</Button>
          <Button mode="contained">Join</Button>
        </Card.Actions>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Sessions</Text>
        <Searchbar
          placeholder="Search sessions"
          onChangeText={onChangeSearch}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>

      <View style={styles.filterContainer}>
        {['upcoming', 'past', 'all'].map((filter) => (
          <Button
            key={filter}
            mode={activeFilter === filter ? 'contained' : 'outlined'}
            style={styles.filterButton}
            onPress={() => setActiveFilter(filter)}
          >
            {filter.charAt(0).toUpperCase() + filter.slice(1)}
          </Button>
        ))}
      </View>

      <Divider style={styles.divider} />

      <FlatList
        data={SESSIONS}
        renderItem={renderSessionItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.sessionsList}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  searchBar: {
    marginBottom: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 8,
  },
  filterButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  divider: {
    marginVertical: 8,
  },
  sessionsList: {
    padding: 16,
  },
  sessionCard: {
    marginBottom: 16,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionDate: {
    color: '#666',
  },
  statusChip: {
    height: 24,
  },
  confirmedChip: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  pendingChip: {
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  mentorName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  sessionType: {
    fontSize: 14,
    marginBottom: 8,
  },
});

export default SessionsScreen; 