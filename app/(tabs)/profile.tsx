import ThemeToggle from '@/components/theme-toggle';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-color';
import { useLongPressTheme } from '@/hooks/use-triple-tap-theme';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import { Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();
  const [showSignOutModal, setShowSignOutModal] = React.useState(false);
  const colors = useThemeColors();
  const { handleLongPressStart, handleLongPressEnd } = useLongPressTheme();

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
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={[styles.panel, styles.profileHeader, { backgroundColor: colors.surface, borderColor: colors.borderAccent }]}>
          <Image
            source={{ uri: user?.imageUrl }}
            style={[styles.profileImage, { borderColor: colors.borderAccent }]}
          />
          <View style={styles.profileInfo}>
            <TouchableOpacity 
              onPressIn={handleLongPressStart} 
              onPressOut={handleLongPressEnd}
              activeOpacity={0.7}
            >
              <ThemedText style={styles.profileName} numberOfLines={1}>{user?.fullName}</ThemedText>
            </TouchableOpacity>
            <ThemedText variant="secondary" style={styles.profileEmail} numberOfLines={1}>{user?.primaryEmailAddress?.emailAddress}</ThemedText>
          </View>
          <ThemeToggle size="small" />
        </View>

        {/* Profile Details */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Account Information</ThemedText>
          <View style={[styles.panel, styles.detailItem, { backgroundColor: colors.surface }]}>
            <Ionicons name="person-outline" size={20} color={colors.iconAccent} />
            <View style={styles.detailContent}>
              <ThemedText variant="secondary" style={styles.detailLabel}>Full Name</ThemedText>
              <ThemedText style={styles.detailValue}>{user?.fullName || 'Not set'}</ThemedText>
            </View>
          </View>
          <View style={[styles.panel, styles.detailItem, { backgroundColor: colors.surface }]}>
            <Ionicons name="mail-outline" size={20} color={colors.iconAccent} />
            <View style={styles.detailContent}>
              <ThemedText variant="secondary" style={styles.detailLabel}>Email</ThemedText>
              <ThemedText style={styles.detailValue}>{user?.primaryEmailAddress?.emailAddress || 'Not set'}</ThemedText>
            </View>
          </View>
          <View style={[styles.panel, styles.detailItem, { backgroundColor: colors.surface }]}>
            <Ionicons name="calendar-outline" size={20} color={colors.iconAccent} />
            <View style={styles.detailContent}>
              <ThemedText variant="secondary" style={styles.detailLabel}>Member Since</ThemedText>
              <ThemedText style={styles.detailValue}>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}</ThemedText>
            </View>
          </View>
        </View>

        {/* Reading Stats */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Reading Statistics</ThemedText>
          <View style={styles.statsGrid}>
            <View style={[styles.panel, styles.statCard, { backgroundColor: colors.surface }]}>
              <ThemedText variant="accent" style={styles.statNumber}>12</ThemedText>
              <ThemedText variant="secondary" style={styles.statLabel}>Books Read</ThemedText>
            </View>
            <View style={[styles.panel, styles.statCard, { backgroundColor: colors.surface }]}>
              <ThemedText variant="accent" style={styles.statNumber}>3</ThemedText>
              <ThemedText variant="secondary" style={styles.statLabel}>Currently</ThemedText>
            </View>
            <View style={[styles.panel, styles.statCard, { backgroundColor: colors.surface }]}>
              <ThemedText variant="accent" style={styles.statNumber}>1,250</ThemedText>
              <ThemedText variant="secondary" style={styles.statLabel}>Pages Read</ThemedText>
            </View>
            <View style={[styles.panel, styles.statCard, { backgroundColor: colors.surface }]}>
              <ThemedText variant="accent" style={styles.statNumber}>15</ThemedText>
              <ThemedText variant="secondary" style={styles.statLabel}>Day Streak</ThemedText>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Account Actions</ThemedText>
          <TouchableOpacity style={[styles.panel, styles.actionButton, styles.signOutButton, { backgroundColor: colors.surface, borderColor: colors.error }]} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
            <ThemedText style={[styles.signOutButtonText, { color: colors.error }]}>Sign Out</ThemedText>
            <Ionicons name="chevron-forward" size={16} color={colors.icon} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.panel, styles.actionButton, { backgroundColor: colors.surface }]}>
            <Ionicons name="bookmark-outline" size={20} color={colors.icon} />
            <ThemedText style={styles.actionButtonText}>My Bookmarks</ThemedText>
            <Ionicons name="chevron-forward" size={16} color={colors.icon} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Custom Sign Out Modal */}
      <Modal visible={showSignOutModal} transparent animationType="fade" onRequestClose={cancelSignOut}>
        <View style={styles.modalOverlay}>
          <View style={[styles.panel, styles.modalContainer, { backgroundColor: colors.surface, borderColor: colors.borderAccent }]}>
            <View style={styles.modalHeader}>
              <Ionicons name="log-out-outline" size={32} color={colors.iconAccent} />
              <ThemedText style={styles.modalTitle}>Sign Out</ThemedText>
              <ThemedText variant="secondary" style={styles.modalMessage}>Are you sure you want to sign out?</ThemedText>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalCancelButton, { backgroundColor: colors.surfaceSecondary }]} onPress={cancelSignOut}>
                <ThemedText variant="secondary" style={styles.modalCancelText}>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalConfirmButton, { backgroundColor: colors.error }]} onPress={confirmSignOut}>
                <ThemedText style={[styles.modalConfirmText, { color: colors.text }]}>Sign Out</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  // --- Base Panel Style ---
  panel: {
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
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 20,
    borderWidth: 2,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: Fonts.heading,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    fontFamily: Fonts.rounded,
  },
  // --- Sections & Details ---
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
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
    fontFamily: Fonts.rounded,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
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
    fontFamily: Fonts.heading,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
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
    fontFamily: Fonts.rounded,
    marginLeft: 16,
  },
  signOutButton: {
    // Special border for sign out
  },
  signOutButtonText: {
    flex: 1,
    fontSize: 16,
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
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: Fonts.heading,
    marginTop: 12,
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 16,
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
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontFamily: Fonts.rounded,
    fontWeight: '600',
  },
  modalConfirmButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 16,
    fontFamily: Fonts.rounded,
    fontWeight: '700',
  },
});