import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { openFile, updateContent, setSyncStatus, markAsSaved } from '../store/editorSlice';
import { setCachedFile } from '../store/filesSlice';
import { githubApi } from '../services/githubApi';
import { storageService } from '../services/storage';
import { syncService } from '../services/syncService';
import { FileItem, Repository, CachedFile } from '../types';
import debounce from 'lodash.debounce';
import NetInfo from '@react-native-community/netinfo';

interface EditorScreenProps {
  file: FileItem;
  repository: Repository;
  onBack: () => void;
}

export const EditorScreen: React.FC<EditorScreenProps> = ({ file, repository, onBack }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [localContent, setLocalContent] = useState('');
  const [isOnline, setIsOnline] = useState(true);

  const dispatch = useDispatch();
  const { activeFile, syncStatus } = useSelector((state: RootState) => state.editor);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadFile();

    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
    });

    return () => {
      unsubscribe();
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const loadFile = async () => {
    setIsLoading(true);

    try {
      let content = '';
      let sha = file.sha;

      // Try to load from cache first
      const cached = await storageService.getCachedFile(repository.fullName, file.path);

      if (cached) {
        content = cached.content;
        sha = cached.sha;
      } else if (file.sha) {
        // File exists on GitHub, fetch it
        const result = await githubApi.getFileContent(repository.owner, repository.name, file.path);
        content = result.content;
        sha = result.sha;

        // Cache it
        const cachedFile: CachedFile = {
          path: file.path,
          content,
          sha,
          lastSynced: Date.now(),
          isDirty: false,
        };
        await storageService.saveCachedFile(repository.fullName, cachedFile);
        dispatch(setCachedFile(cachedFile));
      }
      // else: new file, start with empty content

      dispatch(openFile({ path: file.path, content, sha }));
      setLocalContent(content);
    } catch (err: any) {
      dispatch(setSyncStatus({
        state: 'error',
        error: err.message || 'Failed to load file',
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const performSave = async (content: string, sha: string) => {
    if (!isOnline) {
      // Queue for later
      await syncService.addToQueue(repository.fullName, file.path, content, sha);
      dispatch(setSyncStatus({
        state: 'saved',
        lastSaved: Date.now(),
        error: 'Offline - will sync when connected',
      }));
      return;
    }

    dispatch(setSyncStatus({ state: 'saving' }));

    try {
      const result = await githubApi.updateFile(
        repository.owner,
        repository.name,
        file.path,
        content,
        sha || null
      );

      // Update cache
      const cachedFile: CachedFile = {
        path: file.path,
        content,
        sha: result.sha,
        lastSynced: Date.now(),
        isDirty: false,
      };
      await storageService.saveCachedFile(repository.fullName, cachedFile);
      dispatch(setCachedFile(cachedFile));
      dispatch(markAsSaved({ sha: result.sha }));
    } catch (err: any) {
      // On error, queue for retry
      await syncService.addToQueue(repository.fullName, file.path, content, sha);
      dispatch(setSyncStatus({
        state: 'error',
        error: err.message || 'Failed to save',
      }));
    }
  };

  const debouncedSave = useCallback(
    debounce((content: string, sha: string) => {
      performSave(content, sha);
    }, 10000),
    [isOnline, repository, file.path]
  );

  const handleTextChange = (text: string) => {
    setLocalContent(text);
    dispatch(updateContent(text));

    if (activeFile) {
      debouncedSave(text, activeFile.sha);
    }
  };

  const handleManualSave = () => {
    if (activeFile) {
      debouncedSave.cancel();
      performSave(localContent, activeFile.sha);
    }
  };

  const getSyncStatusText = () => {
    if (!isOnline && syncStatus.state !== 'saving') {
      return '📡 Offline';
    }

    switch (syncStatus.state) {
      case 'idle':
        return 'Idle';
      case 'saving':
        return 'Saving...';
      case 'saved':
        if (syncStatus.error) {
          return syncStatus.error;
        }
        const timeSince = syncStatus.lastSaved ? Math.floor((Date.now() - syncStatus.lastSaved) / 1000) : 0;
        return timeSince < 60 ? `Saved ✓` : `Saved ${timeSince}s ago`;
      case 'error':
        return `Error ⚠ ${syncStatus.error || ''}`;
      default:
        return '';
    }
  };

  const getSyncStatusColor = () => {
    if (!isOnline) return '#f66a0a';
    switch (syncStatus.state) {
      case 'saving':
        return '#0366d6';
      case 'saved':
        return '#28a745';
      case 'error':
        return '#d73a49';
      default:
        return '#586069';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0366d6" />
          <Text style={styles.loadingText}>Loading file...</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backButton}>‹ Back</Text>
        </TouchableOpacity>

        <View style={styles.fileInfo}>
          <Text style={styles.fileName} numberOfLines={1}>
            {file.name}
          </Text>
          <Text style={[styles.syncStatus, { color: getSyncStatusColor() }]}>
            {getSyncStatusText()}
          </Text>
        </View>

        {syncStatus.state === 'error' && (
          <TouchableOpacity
            style={styles.retryButton}
            onPress={handleManualSave}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        )}

        {syncStatus.state !== 'saving' && syncStatus.state !== 'error' && (
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleManualSave}
          >
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        )}
      </View>

      <TextInput
        style={styles.editor}
        value={localContent}
        onChangeText={handleTextChange}
        multiline
        placeholder="Start typing..."
        placeholderTextColor="#999"
        autoCorrect={false}
        autoCapitalize="sentences"
        spellCheck
      />

      <View style={styles.footer}>
        <Text style={styles.stats}>
          {localContent.length} characters · {localContent.split(/\s+/).filter(w => w).length} words
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e4e8',
    gap: 12,
  },
  backButton: {
    fontSize: 18,
    color: '#0366d6',
    fontWeight: '600',
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#24292e',
  },
  syncStatus: {
    fontSize: 12,
    marginTop: 2,
  },
  retryButton: {
    backgroundColor: '#d73a49',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#0366d6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  editor: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    lineHeight: 24,
    color: '#24292e',
    textAlignVertical: 'top',
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#e1e4e8',
  },
  stats: {
    fontSize: 12,
    color: '#586069',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#586069',
  },
});
