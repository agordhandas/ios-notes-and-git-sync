import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { addRepository, removeRepository, setActiveRepository, setRepositories } from '../store/repositoriesSlice';
import { githubApi } from '../services/githubApi';
import { storageService } from '../services/storage';
import { Repository } from '../types';

interface RepositoryListScreenProps {
  onSelectRepository: (repo: Repository) => void;
}

export const RepositoryListScreen: React.FC<RepositoryListScreenProps> = ({ onSelectRepository }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [repoInput, setRepoInput] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dispatch = useDispatch();
  const repositories = useSelector((state: RootState) => state.repositories.list);

  useEffect(() => {
    loadRepositories();
  }, []);

  const loadRepositories = async () => {
    try {
      const savedRepos = await storageService.getRepositories();
      dispatch(setRepositories(savedRepos));
    } catch (err) {
      console.error('Error loading repositories:', err);
    }
  };

  const parseRepoInput = (input: string): { owner: string; repo: string } | null => {
    const trimmed = input.trim();

    // Handle GitHub URL format
    const urlMatch = trimmed.match(/github\.com\/([^\/]+)\/([^\/\?#]+)/);
    if (urlMatch) {
      return { owner: urlMatch[1], repo: urlMatch[2] };
    }

    // Handle owner/repo format
    const directMatch = trimmed.match(/^([^\/]+)\/([^\/]+)$/);
    if (directMatch) {
      return { owner: directMatch[1], repo: directMatch[2] };
    }

    return null;
  };

  const handleAddRepository = async () => {
    const parsed = parseRepoInput(repoInput);
    if (!parsed) {
      setError('Invalid format. Use "owner/repo" or GitHub URL');
      return;
    }

    setIsAdding(true);
    setError(null);

    try {
      const { owner, repo } = parsed;
      const repoInfo = await githubApi.getRepositoryInfo(owner, repo);

      const newRepo: Repository = {
        id: repoInfo.id.toString(),
        owner,
        name: repo,
        fullName: `${owner}/${repo}`,
        addedAt: Date.now(),
      };

      dispatch(addRepository(newRepo));
      const updatedRepos = [...repositories, newRepo];
      await storageService.saveRepositories(updatedRepos);

      setShowAddModal(false);
      setRepoInput('');
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('Repository not found or you don\'t have access');
      } else {
        setError(err.message || 'Failed to add repository');
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveRepository = (repo: Repository) => {
    Alert.alert(
      'Remove Repository',
      `Remove ${repo.fullName} from the list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            dispatch(removeRepository(repo.id));
            const updatedRepos = repositories.filter(r => r.id !== repo.id);
            await storageService.saveRepositories(updatedRepos);
          },
        },
      ]
    );
  };

  const handleSelectRepository = (repo: Repository) => {
    dispatch(setActiveRepository(repo));
    onSelectRepository(repo);
  };

  const renderRepository = ({ item }: { item: Repository }) => (
    <TouchableOpacity
      style={styles.repoItem}
      onPress={() => handleSelectRepository(item)}
      onLongPress={() => handleRemoveRepository(item)}
    >
      <Text style={styles.repoName}>{item.fullName}</Text>
      <Text style={styles.repoDate}>
        Added {new Date(item.addedAt).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Repositories</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {repositories.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No repositories added yet</Text>
          <Text style={styles.emptySubtext}>Tap "Add" to get started</Text>
        </View>
      ) : (
        <FlatList
          data={repositories}
          renderItem={renderRepository}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}

      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Repository</Text>

            <TextInput
              style={styles.input}
              value={repoInput}
              onChangeText={text => {
                setRepoInput(text);
                setError(null);
              }}
              placeholder="owner/repo or GitHub URL"
              placeholderTextColor="#999"
              autoCapitalize="none"
              autoCorrect={false}
            />

            {error && <Text style={styles.errorText}>{error}</Text>}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowAddModal(false);
                  setRepoInput('');
                  setError(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleAddRepository}
                disabled={isAdding}
              >
                {isAdding ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>Add</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e4e8',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#24292e',
  },
  addButton: {
    backgroundColor: '#0366d6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  repoItem: {
    backgroundColor: '#f6f8fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e1e4e8',
  },
  repoName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#24292e',
    marginBottom: 4,
  },
  repoDate: {
    fontSize: 14,
    color: '#586069',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#586069',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6a737d',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '85%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#24292e',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5da',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  errorText: {
    color: '#d73a49',
    fontSize: 14,
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f6f8fa',
  },
  cancelButtonText: {
    color: '#586069',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#0366d6',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
