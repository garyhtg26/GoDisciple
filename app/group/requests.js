import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle, XCircle, ClipboardList } from 'lucide-react-native';
import { useAuthContext } from '../../src/context/AuthContext';
import { getPendingRequests, reviewJoinRequest } from '../../src/services/groupService';
import { getUserProfile } from '../../src/services/userService';
import Avatar from '../../src/components/Avatar';
import LoadingState from '../../src/components/LoadingState';
import EmptyState from '../../src/components/EmptyState';
import AppHeader from '../../src/components/AppHeader';
import Colors from '../../src/constants/colors';
import Typography from '../../src/constants/typography';
import Spacing from '../../src/constants/spacing';
import { formatDate } from '../../src/utils/formatDate';

export default function RequestsScreen() {
  const { user, profile } = useAuthContext();
  const [requests, setRequests] = useState([]);
  const [requestUsers, setRequestUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => { if (profile?.groupId) loadRequests(); }, [profile?.groupId]);

  async function loadRequests() {
    try {
      const reqs = await getPendingRequests(profile.groupId);
      setRequests(reqs);
      const userMap = {};
      await Promise.all(reqs.map(async r => { userMap[r.userId] = await getUserProfile(r.userId); }));
      setRequestUsers(userMap);
    } catch (e) { console.warn(e); }
    finally { setLoading(false); }
  }

  async function handleReview(requestId, status) {
    setActionLoading(requestId + status);
    try {
      await reviewJoinRequest(requestId, status, user.uid);
      Alert.alert('Done', status === 'approved' ? 'Member approved!' : 'Request rejected.');
      setRequests(r => r.filter(req => req.id !== requestId));
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not process request.');
    } finally { setActionLoading(null); }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AppHeader title="Join Requests" showBack />
      {loading ? (
        <LoadingState />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {requests.length === 0 ? (
            <EmptyState
              IconComponent={ClipboardList}
              title="No pending requests"
              subtitle="All join requests have been reviewed."
            />
          ) : (
            requests.map(req => {
              const reqUser = requestUsers[req.userId];
              const appLoading = actionLoading === req.id + 'approved';
              const rejLoading = actionLoading === req.id + 'rejected';
              return (
                <View key={req.id} style={styles.card}>
                  <View style={styles.userRow}>
                    <Avatar uri={reqUser?.photoURL} name={reqUser?.fullName} size={44} />
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{reqUser?.fullName || 'Unknown'}</Text>
                      <Text style={styles.userEmail}>{reqUser?.email}</Text>
                      <Text style={styles.date}>Requested {formatDate(req.createdAt)}</Text>
                    </View>
                  </View>

                  {req.message ? (
                    <View style={styles.messageBox}>
                      <Text style={styles.messageLabel}>Message</Text>
                      <Text style={styles.messageText}>{req.message}</Text>
                    </View>
                  ) : null}

                  <View style={styles.btnRow}>
                    <TouchableOpacity
                      style={[styles.btn, styles.approveBtn]}
                      onPress={() => handleReview(req.id, 'approved')}
                      disabled={!!actionLoading}
                    >
                      {appLoading
                        ? <ActivityIndicator size="small" color={Colors.white} />
                        : <><CheckCircle size={15} color={Colors.white} /><Text style={styles.approveBtnText}>Approve</Text></>
                      }
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.btn, styles.rejectBtn]}
                      onPress={() => handleReview(req.id, 'rejected')}
                      disabled={!!actionLoading}
                    >
                      {rejLoading
                        ? <ActivityIndicator size="small" color={Colors.error} />
                        : <><XCircle size={15} color={Colors.error} /><Text style={styles.rejectBtnText}>Reject</Text></>
                      }
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.base, paddingBottom: Spacing.xxxl },
  card: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: Spacing.base,
    marginBottom: Spacing.md,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm },
  userInfo: { flex: 1 },
  userName: { fontSize: Typography.base, fontWeight: Typography.semiBold, color: Colors.text },
  userEmail: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 1 },
  date: { fontSize: Typography.xs, color: Colors.textLight, marginTop: 2 },
  messageBox: {
    backgroundColor: Colors.surfaceAlt, borderRadius: 8,
    padding: Spacing.sm, marginBottom: Spacing.sm,
  },
  messageLabel: { fontSize: Typography.xs, fontWeight: Typography.bold, color: Colors.textLight, marginBottom: 2 },
  messageText: { fontSize: Typography.sm, color: Colors.text },
  btnRow: { flexDirection: 'row', gap: Spacing.sm },
  btn: {
    flex: 1, borderRadius: 10, paddingVertical: 10,
    alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6,
  },
  approveBtn: { backgroundColor: Colors.success },
  rejectBtn: { backgroundColor: '#FFF0F0', borderWidth: 1, borderColor: Colors.error },
  approveBtnText: { color: Colors.white, fontWeight: Typography.semiBold, fontSize: Typography.sm },
  rejectBtnText: { color: Colors.error, fontWeight: Typography.semiBold, fontSize: Typography.sm },
});
