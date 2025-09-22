import { Fonts } from '@/constants/theme';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// --- New "Monochrome Focus" Color Palette ---
const Colors = {
  BACKGROUND:     '#101014', // Deep, dark charcoal
  SURFACE:        '#1E1E24', // Slightly lighter charcoal for panels
  TEXT_PRIMARY:   '#F0F0F5', // Bright Off-White
  TEXT_SECONDARY: '#A9A8B3', // Muted Light Grey
  ACCENT_GLOW:    '#A855F7', // Vibrant Glowing Purple (consistent accent)
  DANGER:         '#FF78B4', // Glowing pink (consistent accent)
};

export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();
  const [showSignOutModal, setShowSignOutModal] = React.useState(false);

  const handleSignOut = () => setShowSignOutModal(true);

  const confirmSignOut = async () => {
    try {
      await signOut();
      router.replace('/sign-in');
    } catch (error) {
      console.error('Error signing out:', error);
    }
    setShowSignOutModal(false);
  };

  const cancelSignOut = () => setShowSignOutModal(false);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={[styles.panel, styles.profileHeader]}>
          <Image
            source={{ uri: user?.imageUrl }}
            style={styles.profileImage}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName} numberOfLines={1}>{user?.fullName}</Text>
            <Text style={styles.profileEmail} numberOfLines={1}>{user?.primaryEmailAddress?.emailAddress}</Text>
          </View>
        </View>

        {/* Profile Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          <View style={[styles.panel, styles.detailItem]}>
            <Ionicons name="person-outline" size={20} color={Colors.ACCENT_GLOW} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Full Name</Text>
              <Text style={styles.detailValue}>{user?.fullName || 'Not set'}</Text>
            </View>
          </View>
          <View style={[styles.panel, styles.detailItem]}>
            <Ionicons name="mail-outline" size={20} color={Colors.ACCENT_GLOW} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Email</Text>
              <Text style={styles.detailValue}>{user?.primaryEmailAddress?.emailAddress || 'Not set'}</Text>
            </View>
          </View>
          <View style={[styles.panel, styles.detailItem]}>
            <Ionicons name="calendar-outline" size={20} color={Colors.ACCENT_GLOW} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Member Since</Text>
              <Text style={styles.detailValue}>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}</Text>
            </View>
          </View>
        </View>

        {/* Reading Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reading Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.panel, styles.statCard]}><Text style={styles.statNumber}>12</Text><Text style={styles.statLabel}>Books Read</Text></View>
            <View style={[styles.panel, styles.statCard]}><Text style={styles.statNumber}>3</Text><Text style={styles.statLabel}>Currently</Text></View>
            <View style={[styles.panel, styles.statCard]}><Text style={styles.statNumber}>1,250</Text><Text style={styles.statLabel}>Pages Read</Text></View>
            <View style={[styles.panel, styles.statCard]}><Text style={styles.statNumber}>15</Text><Text style={styles.statLabel}>Day Streak</Text></View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Actions</Text>
          <TouchableOpacity style={[styles.panel, styles.actionButton, styles.signOutButton]} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={20} color={Colors.DANGER} />
            <Text style={styles.signOutButtonText}>Sign Out</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.TEXT_SECONDARY} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.panel, styles.actionButton]}>
            <Ionicons name="bookmark-outline" size={20} color={Colors.TEXT_PRIMARY} /><Text style={styles.actionButtonText}>My Bookmarks</Text><Ionicons name="chevron-forward" size={16} color={Colors.TEXT_SECONDARY} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Custom Sign Out Modal */}
      <Modal visible={showSignOutModal} transparent animationType="fade" onRequestClose={cancelSignOut}>
        <View style={styles.modalOverlay}>
          <View style={[styles.panel, styles.modalContainer]}>
            <View style={styles.modalHeader}>
              <Ionicons name="log-out-outline" size={32} color={Colors.ACCENT_GLOW} />
              <Text style={styles.modalTitle}>Sign Out</Text>
              <Text style={styles.modalMessage}>Are you sure you want to sign out?</Text>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={cancelSignOut}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmButton} onPress={confirmSignOut}>
                <Text style={styles.modalConfirmText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.BACKGROUND,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  // --- Base Panel Style ---
  panel: {
    backgroundColor: Colors.SURFACE,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'transparent', // Default to no border
  },
  // --- Profile Header ---
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
    padding: 24,
    borderColor: Colors.ACCENT_GLOW, // Accent border for hero element
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 20,
    borderWidth: 2,
    borderColor: Colors.ACCENT_GLOW,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.TEXT_PRIMARY,
    fontFamily: Fonts.heading,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: Colors.TEXT_SECONDARY,
    fontFamily: Fonts.rounded,
  },
  // --- Sections & Details ---
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.TEXT_PRIMARY,
    fontFamily: Fonts.heading,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginBottom: 12,
  },
  detailContent: {
    flex: 1,
    marginLeft: 16,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.TEXT_SECONDARY,
    fontFamily: Fonts.rounded,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: Colors.TEXT_PRIMARY,
    fontFamily: Fonts.rounded,
    fontWeight: '600',
  },
  // --- Stats Section ---
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statCard: {
    padding: 20,
    alignItems: 'center',
    flex: 1,
    minWidth: '45%',
  },
  statNumber: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.ACCENT_GLOW,
    fontFamily: Fonts.heading,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.TEXT_SECONDARY,
    fontFamily: Fonts.rounded,
    textAlign: 'center',
  },
  // --- Action Buttons ---
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginBottom: 12,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    color: Colors.TEXT_PRIMARY,
    fontFamily: Fonts.rounded,
    marginLeft: 16,
  },
  signOutButton: {
    borderColor: Colors.DANGER, // Special border for sign out
  },
  signOutButtonText: {
    flex: 1,
    fontSize: 16,
    color: Colors.DANGER,
    fontFamily: Fonts.rounded,
    marginLeft: 16,
    fontWeight: '600',
  },
  // --- Modal Styles ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    padding: 24,
    width: '100%',
    maxWidth: 340,
    borderColor: Colors.ACCENT_GLOW,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.TEXT_PRIMARY,
    fontFamily: Fonts.heading,
    marginTop: 12,
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 16,
    color: Colors.TEXT_SECONDARY,
    fontFamily: Fonts.rounded,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    color: Colors.TEXT_SECONDARY,
    fontFamily: Fonts.rounded,
    fontWeight: '600',
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: Colors.ACCENT_GLOW,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: Fonts.rounded,
    fontWeight: '700',
  },
});