import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, AppRegistry, TouchableOpacity, TextInput, Alert, Modal, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LoginScreen } from './UserAuth';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentScreen, setCurrentScreen] = useState('home');
  const [prayers, setPrayers] = useState([]);
  const [communityPrayers, setCommunityPrayers] = useState([]);
  const [newPrayer, setNewPrayer] = useState({ title: '', content: '', isPublic: false });
  const [prayerModal, setPrayerModal] = useState({ visible: false, prayer: null, generatedPrayer: '', loading: false });

  // Load community prayers from the API when user logs in
  useEffect(() => {
    if (currentUser) {
      loadCommunityPrayers();
      loadUserPrayers();
    }
  }, [currentUser]);

  const loadCommunityPrayers = async () => {
    try {
      console.log('Loading community prayers from your API...');
      
      // Use the actual logged in user's ID from production API
      const userId = currentUser?.id;
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York';
      
      console.log('Making API call with userId:', userId, 'timezone:', timezone);
      
      const response = await fetch('https://www.prayoverus.com:3000/getMyRequestFeed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          tz: timezone
        }),
        timeout: 10000,
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('API Response:', data);
        
        // Handle your API response format: { error: 0, result: [...] }
        if (data.error === 0 && data.result) {
          setCommunityPrayers(data.result.map(request => ({
            id: request.request_id,
            title: request.request_title || request.prayer_title,
            content: request.request_text,
            author: request.real_name || request.user_name || 'Anonymous',
            isPublic: true,
            prayedFor: false,
            timestamp: request.timestamp,
            category: request.category_name,
            prayer_title: request.prayer_title,
            other_person: request.other_person,
            picture: request.picture,
            user_id: request.user_id,
            fk_prayer_id: request.fk_prayer_id
          })));
          console.log('Loaded', data.result.length, 'prayer requests from API');
        } else {
          console.log('API returned error:', data.error);
          throw new Error('API returned error response');
        }
      } else {
        console.log('API response error:', response.status);
        throw new Error(`API returned ${response.status}`);
      }
    } catch (error) {
      console.log('Failed to load community prayers from API:', error.message);
      
      // Fallback to sample data for testing
      setCommunityPrayers([
        { id: 1, title: 'Prayer for healing', content: 'Please pray for my grandmother\'s recovery', author: 'Sarah', isPublic: true, prayedFor: false },
        { id: 2, title: 'Job search guidance', content: 'Seeking divine guidance in finding new employment', author: 'Michael', isPublic: true, prayedFor: false },
      ]);
    }
  };

  const loadUserPrayers = async () => {
    try {
      const response = await fetch('https://53c1b6ae-5a8b-4c90-b8ff-6cee45b5c7ac-00-2rlv72l3v4sla.riker.replit.dev/api/prayers/mine', {
        headers: {
          'Authorization': `Bearer ${currentUser.id}` // In production, use proper JWT tokens
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPrayers(data);
      }
    } catch (error) {
      console.log('Failed to load user prayers:', error.message);
    }
  };

  const addPrayer = async () => {
    if (newPrayer.title.trim() && newPrayer.content.trim()) {
      const prayer = {
        id: Date.now(),
        title: newPrayer.title,
        content: newPrayer.content,
        isPublic: newPrayer.isPublic,
        author: currentUser?.firstName || 'You',
        userId: currentUser?.id,
        date: new Date().toLocaleDateString(),
        prayedFor: false
      };
      
      // Save to production API first
      try {
        await savePrayerToAPI(prayer);
        
        // Add to local state after successful API call
        setPrayers([prayer, ...prayers]);
        if (newPrayer.isPublic) {
          setCommunityPrayers([prayer, ...communityPrayers]);
        }
        
        setNewPrayer({ title: '', content: '', isPublic: false });
        Alert.alert('Success', 'Prayer request created and saved to your account!');
        
      } catch (error) {
        // Even if API fails, add to local state for offline functionality
        setPrayers([prayer, ...prayers]);
        if (newPrayer.isPublic) {
          setCommunityPrayers([prayer, ...communityPrayers]);
        }
        setNewPrayer({ title: '', content: '', isPublic: false });
        Alert.alert('Success', 'Prayer added locally (will sync when connection is restored)');
      }
    } else {
      Alert.alert('Error', 'Please fill in both title and content');
    }
  };

  const savePrayerToAPI = async (prayer) => {
    try {
      console.log('Creating prayer request using production API...');
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York';
      
      const response = await fetch('https://www.prayoverus.com:3000/createRequest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser?.id,
          env: "test",
          jsonpCallback: "afterCreateRequest",
          requestText: `${prayer.title} - ${prayer.content}`,
          sendEmail: "off",
          prayerId: 37, // Default prayer ID - you can adjust this
          forMe: prayer.isPublic ? "false" : "true",
          forAll: prayer.isPublic ? "true" : "false", 
          tz: timezone
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Create request API response:', data);
        
        if (data.error === 0) {
          console.log('Prayer request saved successfully:', data.result);
          loadCommunityPrayers(); // Refresh community prayers
        } else {
          console.log('API returned error:', data.error);
          Alert.alert('Warning', 'Prayer saved locally but may not be synced to server');
        }
      } else {
        console.log('API request failed:', response.status);
        Alert.alert('Warning', 'Prayer saved locally but may not be synced to server');
      }
    } catch (error) {
      console.log('Failed to save prayer to production API:', error.message);
      Alert.alert('Warning', 'Prayer saved locally but may not be synced to server');
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

      // Call your existing ChatGPT API service
      try {
        const requestText = `${prayerRequest.title} - ${prayerRequest.content}`;
        const prompt = `Give me a Catholic prayers for this request: ${requestText}. The person who made this request is named ${prayerRequest.author}. Please include their name in the prayer and refer to them in third-person.`;
        
        console.log(`Calling ChatGPT API for: "${prayerRequest.title}" by ${prayerRequest.author}`);
        
        const response = await fetch('https://www.prayoverus.com:3000/chatGPT', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            request: prompt
          }),
        });

        if (response.ok) {
          const data = await response.json();
          
          if (data.error === 0 && data.result) {
            setPrayerModal(prev => ({
              ...prev,
              generatedPrayer: data.result,
              loading: false
            }));
            return;
          } else {
            console.log('API error:', data.result || 'Unknown error');
          }
        } else {
          console.log('API response error:', response.status);
        }
      } catch (error) {
        console.log('ChatGPT API call failed:', error.message);
      }

      // Fallback prayer if API fails
      const fallbackPrayer = `Heavenly Father, we lift up ${prayerRequest.author} to Your loving care and ask for Your blessing upon their prayer request. 

Grant ${prayerRequest.author} Your peace, guidance, and strength in this situation. May Your will be accomplished in their life according to Your perfect plan.

Through Christ our Lord. Amen.`;
      
      setPrayerModal(prev => ({
        ...prev,
        generatedPrayer: fallbackPrayer,
        loading: false
      }));

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

  const markAsPrayed = () => {
    // Mark as prayed for when user clicks Amen
    setCommunityPrayers(prevPrayers =>
      prevPrayers.map(prayer =>
        prayer.id === prayerModal.prayer?.id
          ? { ...prayer, prayedFor: true }
          : prayer
      )
    );
    
    // Close the modal
    closePrayerModal();
  };

  // Show login screen if no current user
  if (!currentUser) {
    return <LoginScreen onLogin={setCurrentUser} />;
  }

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
              <View style={styles.prayerMeta}>
                <Text style={styles.prayerAuthor}>by {prayer.author}</Text>
                {prayer.category && (
                  <Text style={styles.prayerCategory}>• {prayer.category}</Text>
                )}
              </View>
              {prayer.timestamp && (
                <Text style={styles.prayerTime}>
                  {new Date(prayer.timestamp).toLocaleDateString()}
                </Text>
              )}
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
              
              <TouchableOpacity style={styles.closeModalButton} onPress={markAsPrayed}>
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
      
      {/* User Header */}
      <View style={styles.userHeader}>
        <Text style={styles.welcomeText}>Welcome, {currentUser.firstName}!</Text>
        <TouchableOpacity onPress={() => setCurrentUser(null)} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
      
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
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  logoutText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
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
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  prayerAuthor: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
  },
  prayerCategory: {
    fontSize: 14,
    color: '#9ca3af',
    marginLeft: 5,
  },
  prayerTime: {
    fontSize: 12,
    color: '#9ca3af',
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