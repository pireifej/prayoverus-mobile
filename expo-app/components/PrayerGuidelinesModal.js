import React from 'react';
import {
  Alert,
  Linking,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const GUIDELINES_URL = 'https://prayoverus.com/prayer-guidelines.html';

export default function PrayerGuidelinesModal({ visible, onClose }) {
  const openFullGuidelines = async () => {
    try {
      await Linking.openURL(GUIDELINES_URL);
    } catch (error) {
      Alert.alert(
        'Unable to open guidelines',
        'Please try again or visit prayoverus.com/prayer-guidelines.html.'
      );
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕ Close</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Prayer Guidelines</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.intro}>
            Pray Over Us is a place to share personal prayer needs and support
            one another with compassion.
          </Text>

          <Guideline
            number="1"
            title="Keep it prayer-focused"
            text="Share a personal prayer intention or something you would like the community to lift up in prayer."
          />
          <Guideline
            number="2"
            title="Lead with kindness"
            text="Treat every person with dignity. Harassment, bullying, threats, and hateful or abusive content are not allowed."
          />
          <Guideline
            number="3"
            title="Protect privacy"
            text="Only share details you are comfortable making public, and do not post someone else's private information without permission."
          />
          <Guideline
            number="4"
            title="Do not misuse the community"
            text="Do not use prayer requests for spam, advertising, scams, or content unrelated to prayer and faith."
          />
          <Guideline
            number="5"
            title="Ask for help when needed"
            text="Prayer is not a substitute for emergency or professional care. If someone is in immediate danger, contact local emergency services."
          />

          <Text style={styles.moderationNote}>
            Content that violates these standards may be removed, and accounts
            may be restricted or suspended.
          </Text>

          <TouchableOpacity
            onPress={openFullGuidelines}
            style={styles.onlineButton}
            activeOpacity={0.75}
          >
            <Text style={styles.onlineButtonText}>Read the full guidelines online</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

function Guideline({ number, title, text }) {
  return (
    <View style={styles.guideline}>
      <View style={styles.number}>
        <Text style={styles.numberText}>{number}</Text>
      </View>
      <View style={styles.guidelineCopy}>
        <Text style={styles.guidelineTitle}>{title}</Text>
        <Text style={styles.guidelineText}>{text}</Text>
      </View>
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#0d1f3c',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 14,
    backgroundColor: '#0d1f3c',
  },
  closeButton: {
    marginRight: 16,
    paddingVertical: 4,
  },
  closeText: {
    color: '#60a5fa',
    fontSize: 16,
  },
  headerTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 19,
    fontWeight: '700',
  },
  content: {
    padding: 24,
    paddingBottom: 56,
  },
  intro: {
    color: '#e2e8f0',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 22,
  },
  guideline: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  number: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    marginRight: 12,
    marginTop: 1,
  },
  numberText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  guidelineCopy: {
    flex: 1,
  },
  guidelineTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 5,
  },
  guidelineText: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 21,
  },
  moderationNote: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 2,
    marginBottom: 22,
  },
  onlineButton: {
    borderWidth: 1,
    borderColor: '#60a5fa',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  onlineButtonText: {
    color: '#93c5fd',
    fontSize: 14,
    fontWeight: '700',
  },
};