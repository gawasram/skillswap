import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { Text, Card, Avatar, Button, Chip, Searchbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

// Placeholder mentors data
const MENTORS = [
  {
    id: '1',
    name: 'Alice Johnson',
    avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
    rating: 4.8,
    hourlyRate: 50,
    skills: ['React Native', 'JavaScript', 'TypeScript'],
    bio: 'Experienced mobile developer with 5+ years of industry experience.',
  },
  {
    id: '2',
    name: 'Bob Smith',
    avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
    rating: 4.6,
    hourlyRate: 45,
    skills: ['JavaScript', 'Node.js', 'Express'],
    bio: 'Full-stack developer specializing in Node.js and modern JavaScript.',
  },
  {
    id: '3',
    name: 'Carol Davis',
    avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
    rating: 4.9,
    hourlyRate: 55,
    skills: ['UI/UX Design', 'Figma', 'Adobe XD'],
    bio: 'Design-focused developer with experience in creating beautiful user interfaces.',
  },
  {
    id: '4',
    name: 'David Wilson',
    avatar: 'https://randomuser.me/api/portraits/men/2.jpg',
    rating: 4.7,
    hourlyRate: 60,
    skills: ['Blockchain', 'Web3', 'Solidity'],
    bio: 'Blockchain expert specializing in smart contract development and Web3 integration.',
  },
];

const MentorsScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleSkillFilter = (skill: string) => {
    setSelectedSkill(selectedSkill === skill ? '' : skill);
  };

  const renderMentorItem = ({ item }: { item: any }) => (
    <Card style={styles.mentorCard}>
      <Card.Content>
        <View style={styles.mentorHeader}>
          <Avatar.Image source={{ uri: item.avatar }} size={60} />
          <View style={styles.mentorInfo}>
            <Text style={styles.mentorName}>{item.name}</Text>
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingText}>⭐ {item.rating}</Text>
              <Text style={styles.rateText}>${item.hourlyRate}/hr</Text>
            </View>
          </View>
        </View>
        
        <Text style={styles.bioText}>{item.bio}</Text>
        
        <View style={styles.skillsContainer}>
          {item.skills.map((skill: string) => (
            <Chip key={skill} style={styles.skillChip} onPress={() => handleSkillFilter(skill)}>
              {skill}
            </Chip>
          ))}
        </View>
      </Card.Content>
      
      <Card.Actions>
        <Button>View Profile</Button>
        <Button mode="contained">Book Session</Button>
      </Card.Actions>
    </Card>
  );

  // Filter mentors based on search query and selected skill
  const filteredMentors = MENTORS.filter(mentor => {
    const matchesSearch = searchQuery === '' || 
      mentor.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      mentor.bio.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSkill = selectedSkill === '' || 
      mentor.skills.some(skill => skill.toLowerCase() === selectedSkill.toLowerCase());
    
    return matchesSearch && matchesSkill;
  });

  // Get all unique skills for the filter
  const allSkills = [...new Set(MENTORS.flatMap(mentor => mentor.skills))];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Find a Mentor</Text>
        <Searchbar
          placeholder="Search mentors"
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>

      <View style={styles.skillFilters}>
        <Text style={styles.filterTitle}>Filter by skill:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {allSkills.map(skill => (
            <Chip
              key={skill}
              selected={skill === selectedSkill}
              onPress={() => handleSkillFilter(skill)}
              style={styles.filterChip}
            >
              {skill}
            </Chip>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredMentors}
        renderItem={renderMentorItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.mentorsList}
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
  skillFilters: {
    padding: 16,
    paddingTop: 0,
  },
  filterTitle: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  filterChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  mentorsList: {
    padding: 16,
    paddingTop: 0,
  },
  mentorCard: {
    marginBottom: 16,
  },
  mentorHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  mentorInfo: {
    marginLeft: 16,
    flex: 1,
    justifyContent: 'center',
  },
  mentorName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  ratingContainer: {
    flexDirection: 'row',
    marginTop: 4,
  },
  ratingText: {
    marginRight: 8,
  },
  rateText: {
    fontWeight: 'bold',
  },
  bioText: {
    marginBottom: 16,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  skillChip: {
    marginRight: 8,
    marginBottom: 8,
  },
});

export default MentorsScreen; 