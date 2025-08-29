import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, AppRegistry, TouchableOpacity, TextInput, Alert, Modal, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';

function App() {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [prayers, setPrayers] = useState([]);
  const [communityPrayers, setCommunityPrayers] = useState([
    { id: 1, title: 'Prayer for healing', content: 'Please pray for my grandmother\'s recovery', author: 'Sarah', isPublic: true, prayedFor: false },
    { id: 2, title: 'Job search guidance', content: 'Seeking divine guidance in finding new employment', author: 'Michael', isPublic: true, prayedFor: false },
  ]);
  const [newPrayer, setNewPrayer] = useState({ title: '', content: '', isPublic: false });
  const [prayerModal, setPrayerModal] = useState({ visible: false, prayer: null, generatedPrayer: '', loading: false });

  const addPrayer = () => {
    if (newPrayer.title.trim() && newPrayer.content.trim()) {
      const prayer = {
        id: Date.now(),
        title: newPrayer.title,
        content: newPrayer.content,
        isPublic: newPrayer.isPublic,
        author: 'You',
        date: new Date().toLocaleDateString(),
        prayedFor: false
      };
      
      setPrayers([prayer, ...prayers]);
      if (newPrayer.isPublic) {
        setCommunityPrayers([prayer, ...communityPrayers]);
      }
      
      setNewPrayer({ title: '', content: '', isPublic: false });
      Alert.alert('Success', 'Prayer added successfully!');
    } else {
      Alert.alert('Error', 'Please fill in both title and content');
    }
  };

  const generatePrayer = async (prayerRequest) => {
    try {
      setPrayerModal({
        visible: true,
        prayer: prayerRequest,
        generatedPrayer: '',
        loading: true
      });

      // For development mode, create a simple prayer response without backend API
      // This avoids network issues with cross-origin requests in Expo
      const prayers = {
        'Prayer for healing': 'Heavenly Father, we lift up this request for healing and recovery. May your loving presence bring comfort, strength, and restoration during this difficult time. Grant wisdom to medical professionals and surround this person with your peace.',
        'Job search guidance': 'Divine Creator, we seek your guidance for those searching for meaningful employment. Open doors of opportunity, provide clarity in decision-making, and grant confidence during this transition. May the right path be illuminated with your light.',
        'default': 'Loving God, we bring this heartfelt request before you. Please provide comfort, guidance, and strength to all who are in need. May your presence be felt, your love be known, and your peace surround those we pray for.'
      };
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const prayer = prayers[prayerRequest.title] || prayers['default'];
      setPrayerModal(prev => ({
        ...prev,
        generatedPrayer: prayer,
        loading: false
      }));

      // Mark as prayed for
      setCommunityPrayers(prevPrayers =>
        prevPrayers.map(prayer =>
          prayer.id === prayerRequest.id
            ? { ...prayer, prayedFor: true }
            : prayer
        )
      );

    } catch (error) {
      console.error('Error generating prayer:', error);
      setPrayerModal(prev => ({
        ...prev,
        loading: false,
        generatedPrayer: 'We apologize, but we are unable to generate a prayer at this time. Please take a moment to offer your own heartfelt prayer for this request.'
      }));
    }
  };

  const closePrayerModal = () => {
    setPrayerModal({ visible: false, prayer: null, generatedPrayer: '', loading: false });
  };

  if (currentScreen === 'personal') {
    return (
      <View style={styles.container}>
        <StatusBar style="auto" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setCurrentScreen('home')} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Personal Prayers</Text>
        </View>
        
        <ScrollView style={styles.screenContent}>
          <View style={styles.addPrayerForm}>
            <Text style={styles.formTitle}>Add New Prayer</Text>
            <TextInput
              style={styles.input}
              placeholder="Prayer title"
              value={newPrayer.title}
              onChangeText={(text) => setNewPrayer({...newPrayer, title: text})}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Your prayer request..."
              multiline
              numberOfLines={4}
              value={newPrayer.content}
              onChangeText={(text) => setNewPrayer({...newPrayer, content: text})}
            />
            <TouchableOpacity 
              style={[styles.checkbox, newPrayer.isPublic && styles.checkboxChecked]}
              onPress={() => setNewPrayer({...newPrayer, isPublic: !newPrayer.isPublic})}
            >
              <Text style={styles.checkboxText}>
                {newPrayer.isPublic ? '☑' : '☐'} Share with community
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addButton} onPress={addPrayer}>
              <Text style={styles.addButtonText}>Add Prayer</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Your Prayers</Text>
          {prayers.length === 0 ? (
            <Text style={styles.emptyText}>No prayers yet. Add your first prayer above!</Text>
          ) : (
            prayers.map(prayer => (
              <View key={prayer.id} style={styles.prayerCard}>
                <Text style={styles.prayerTitle}>{prayer.title}</Text>
                <Text style={styles.prayerContent}>{prayer.content}</Text>
                <Text style={styles.prayerMeta}>
                  {prayer.date} • {prayer.isPublic ? 'Public' : 'Private'}
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    );
  }

  if (currentScreen === 'community') {
    return (
      <View style={styles.container}>
        <StatusBar style="auto" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setCurrentScreen('home')} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Community Wall</Text>
        </View>
        
        <ScrollView style={styles.screenContent}>
          <Text style={styles.sectionTitle}>Community Prayers</Text>
          {communityPrayers.map(prayer => (
            <View key={prayer.id} style={styles.prayerCard}>
              <Text style={styles.prayerTitle}>{prayer.title}</Text>
              <Text style={styles.prayerContent}>{prayer.content}</Text>
              <Text style={styles.prayerAuthor}>by {prayer.author}</Text>
              <TouchableOpacity 
                style={[styles.prayButton, prayer.prayedFor && styles.prayButtonPrayed]}
                onPress={() => generatePrayer(prayer)}
                disabled={prayer.prayedFor}
              >
                <Text style={[styles.prayButtonText, prayer.prayedFor && styles.prayButtonTextPrayed]}>
                  {prayer.prayedFor ? '✅ Prayed for' : '🙏 Pray for this'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
        
        <Modal
          animationType="slide"
          transparent={true}
          visible={prayerModal.visible}
          onRequestClose={closePrayerModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Prayer for: {prayerModal.prayer?.title}</Text>
                <TouchableOpacity onPress={closePrayerModal} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>×</Text>
                </TouchableOpacity>
              </View>
              
              {prayerModal.loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#6366f1" />
                  <Text style={styles.loadingText}>Generating heartfelt prayer...</Text>
                </View>
              ) : (
                <ScrollView style={styles.prayerTextContainer}>
                  <Text style={styles.generatedPrayer}>{prayerModal.generatedPrayer}</Text>
                </ScrollView>
              )}
              
              <TouchableOpacity style={styles.closeModalButton} onPress={closePrayerModal}>
                <Text style={styles.closeModalButtonText}>Amen</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  if (currentScreen === 'groups') {
    return (
      <View style={styles.container}>
        <StatusBar style="auto" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setCurrentScreen('home')} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Prayer Groups</Text>
        </View>
        
        <ScrollView style={styles.screenContent}>
          <Text style={styles.sectionTitle}>Available Groups</Text>
          <View style={styles.groupCard}>
            <Text style={styles.groupTitle}>Family Prayer Circle</Text>
            <Text style={styles.groupMembers}>5 members</Text>
            <TouchableOpacity style={styles.joinButton}>
              <Text style={styles.joinButtonText}>Join Group</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.groupCard}>
            <Text style={styles.groupTitle}>Healing Prayers</Text>
            <Text style={styles.groupMembers}>12 members</Text>
            <TouchableOpacity style={styles.joinButton}>
              <Text style={styles.joinButtonText}>Join Group</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>PrayOverUs</Text>
        <Text style={styles.subtitle}>Prayer Community App</Text>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome to PrayOverUs</Text>
          <Text style={styles.cardText}>
            Connect with others through prayer and spiritual support.
          </Text>
        </View>

        <TouchableOpacity style={styles.card} onPress={() => setCurrentScreen('personal')}>
          <Text style={styles.cardTitle}>Personal Prayers</Text>
          <Text style={styles.cardText}>
            Create and track your personal prayer requests.
          </Text>
          <Text style={styles.tapHint}>Tap to explore →</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => setCurrentScreen('community')}>
          <Text style={styles.cardTitle}>Community Wall</Text>
          <Text style={styles.cardText}>
            Share prayers and support others in their faith journey.
          </Text>
          <Text style={styles.tapHint}>Tap to explore →</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => setCurrentScreen('groups')}>
          <Text style={styles.cardTitle}>Prayer Groups</Text>
          <Text style={styles.cardText}>
            Join prayer groups with friends and family.
          </Text>
          <Text style={styles.tapHint}>Tap to explore →</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#6366f1',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    color: '#64748b',
    marginBottom: 40,
  },
  card: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1e293b',
  },
  cardText: {
    fontSize: 16,
    color: '#64748b',
    lineHeight: 24,
  },
  tapHint: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    marginRight: 15,
  },
  backText: {
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  screenContent: {
    flex: 1,
    padding: 20,
  },
  addPrayerForm: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#1e293b',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  checkboxChecked: {
    color: '#6366f1',
  },
  checkboxText: {
    fontSize: 16,
    color: '#64748b',
  },
  addButton: {
    backgroundColor: '#6366f1',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#1e293b',
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 20,
  },
  prayerCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  prayerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1e293b',
  },
  prayerContent: {
    fontSize: 16,
    color: '#64748b',
    lineHeight: 22,
    marginBottom: 8,
  },
  prayerMeta: {
    fontSize: 12,
    color: '#9ca3af',
  },
  prayerAuthor: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
    marginBottom: 10,
  },
  prayButton: {
    backgroundColor: '#f0f9ff',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  prayButtonText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '600',
  },
  groupCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#1e293b',
  },
  groupMembers: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 10,
  },
  joinButton: {
    backgroundColor: '#10b981',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  joinButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  prayButtonPrayed: {
    backgroundColor: '#dcfce7',
    borderColor: '#10b981',
  },
  prayButtonTextPrayed: {
    color: '#10b981',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    maxHeight: '80%',
    width: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    flex: 1,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#64748b',
    fontWeight: 'bold',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
    fontStyle: 'italic',
  },
  prayerTextContainer: {
    maxHeight: 300,
    marginBottom: 20,
  },
  generatedPrayer: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
    textAlign: 'left',
  },
  closeModalButton: {
    backgroundColor: '#6366f1',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeModalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

// Register the main component
AppRegistry.registerComponent('main', () => App);
export default App;