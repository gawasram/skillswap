import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Title, Paragraph, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

const HomeScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Hello there!</Text>
          <Text style={styles.subtitle}>What would you like to learn today?</Text>
        </View>

        <Card style={styles.featuredCard}>
          <Card.Cover source={{ uri: 'https://picsum.photos/700' }} />
          <Card.Content>
            <Title>Featured: Mastering Mobile Development</Title>
            <Paragraph>Learn how to build cross-platform mobile apps with React Native from industry experts.</Paragraph>
          </Card.Content>
          <Card.Actions>
            <Button>Explore</Button>
          </Card.Actions>
        </Card>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Sessions</Text>
          <Button mode="text">See All</Button>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          {[1, 2, 3].map((item) => (
            <Card key={item} style={styles.sessionCard}>
              <Card.Content>
                <Text style={styles.sessionDate}>Tue, May 15 • 3:00 PM</Text>
                <Title style={styles.sessionTitle}>Web3 Development Basics</Title>
                <Paragraph style={styles.mentorName}>with John Doe</Paragraph>
              </Card.Content>
              <Card.Actions>
                <Button mode="contained">Join</Button>
              </Card.Actions>
            </Card>
          ))}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Popular Skills</Text>
          <Button mode="text">More</Button>
        </View>

        <View style={styles.skillsContainer}>
          {['React', 'JavaScript', 'Node.js', 'UI/UX Design', 'Python', 'Blockchain'].map((skill) => (
            <Button key={skill} mode="outlined" style={styles.skillButton}>
              {skill}
            </Button>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  featuredCard: {
    marginBottom: 24,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  horizontalScroll: {
    marginBottom: 24,
  },
  sessionCard: {
    width: 280,
    marginRight: 16,
  },
  sessionDate: {
    color: '#666',
    marginBottom: 4,
  },
  sessionTitle: {
    fontSize: 16,
  },
  mentorName: {
    fontSize: 14,
    marginBottom: 8,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  skillButton: {
    margin: 4,
  },
});

export default HomeScreen; 