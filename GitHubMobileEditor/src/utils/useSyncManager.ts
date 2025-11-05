import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { setOnlineStatus, setSyncing } from '../store/syncSlice';
import { syncService } from '../services/syncService';
import NetInfo from '@react-native-community/netinfo';
import { AppState, AppStateStatus } from 'react-native';

export const useSyncManager = () => {
  const dispatch = useDispatch();
  const { isOnline, queue } = useSelector((state: RootState) => state.sync);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    // Monitor network connectivity
    const unsubscribeNetInfo = NetInfo.addEventListener(state => {
      const online = state.isConnected ?? false;
      dispatch(setOnlineStatus(online));

      // When we come back online, try to sync
      if (online && !isOnline && queue.length > 0) {
        processQueue();
      }
    });

    // Monitor app state (foreground/background)
    const appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App came to foreground, check if we need to sync
        if (isOnline && queue.length > 0) {
          processQueue();
        }
      }
      appStateRef.current = nextAppState;
    });

    // Periodic sync check (every 30 seconds when online)
    syncIntervalRef.current = setInterval(() => {
      if (isOnline && queue.length > 0) {
        processQueue();
      }
    }, 30000);

    return () => {
      unsubscribeNetInfo();
      appStateSubscription.remove();
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [isOnline, queue.length]);

  const processQueue = async () => {
    dispatch(setSyncing(true));
    try {
      await syncService.processQueue();
    } catch (err) {
      console.error('Error processing sync queue:', err);
    } finally {
      dispatch(setSyncing(false));
    }
  };

  return {
    isOnline,
    queueLength: queue.length,
    processQueue,
  };
};
