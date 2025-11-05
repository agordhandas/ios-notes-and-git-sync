import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { setFileItems, setLoading, setError, navigateToFolder, navigateBack, resetNavigation } from '../store/filesSlice';
import { githubApi } from '../services/githubApi';
import { FileItem, Repository } from '../types';

interface FileBrowserScreenProps {
  repository: Repository;
  onSelectFile: (file: FileItem) => void;
  onBack: () => void;
}

export const FileBrowserScreen: React.FC<FileBrowserScreenProps> = ({
  repository,
  onSelectFile,
  onBack,
}) => {
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileError, setNewFileError] = useState<string | null>(null);

  const dispatch = useDispatch();
  const { items, loading, error, currentPath, pathHistory } = useSelector((state: RootState) => state.files);

  useEffect(() => {
    loadFiles(currentPath);
  }, [currentPath, repository]);

  const loadFiles = async (path: string) => {
    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      const files = await githubApi.getContents(repository.owner, repository.name, path);
      dispatch(setFileItems(files));
    } catch (err: any) {
      dispatch(setError(err.message || 'Failed to load files'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleItemPress = (item: FileItem) => {
    if (item.type === 'dir') {
      dispatch(navigateToFolder(item.path));
    } else {
      onSelectFile(item);
    }
  };

  const handleGoBack = () => {
    if (pathHistory.length > 0) {
      dispatch(navigateBack());
    } else {
      onBack();
    }
  };

  const handleCreateFile = () => {
    if (!newFileName.trim()) {
      setNewFileError('Please enter a filename');
      return;
    }

    const fullPath = currentPath ? `${currentPath}/${newFileName}` : newFileName;

    const newFile: FileItem = {
      name: newFileName,
      path: fullPath,
      type: 'file',
      sha: '',
      size: 0,
      url: '',
    };

    setShowNewFileModal(false);
    setNewFileName('');
    setNewFileError(null);
    onSelectFile(newFile);
  };

  const getFileIcon = (item: FileItem) => {
    if (item.type === 'dir') {
      return '📁';
    }
    const ext = item.name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'md':
        return '📝';
      case 'txt':
        return '📄';
      case 'js':
      case 'ts':
      case 'jsx':
      case 'tsx':
        return '📜';
      case 'json':
        return '📋';
      default:
        return '📄';
    }
  };

  const renderItem = ({ item }: { item: FileItem }) => (
    <TouchableOpacity
      style={styles.fileItem}
      onPress={() => handleItemPress(item)}
    >
      <Text style={styles.fileIcon}>{getFileIcon(item)}</Text>
      <View style={styles.fileInfo}>
        <Text style={styles.fileName}>{item.name}</Text>
        {item.type === 'file' && (
          <Text style={styles.fileSize}>
            {(item.size / 1024).toFixed(1)} KB
          </Text>
        )}
      </View>
      {item.type === 'dir' && <Text style={styles.chevron}>›</Text>}
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
        <Text style={styles.backButtonText}>
          {pathHistory.length > 0 ? '‹ Back' : '‹ Repos'}
        </Text>
      </TouchableOpacity>

      <View style={styles.titleContainer}>
        <Text style={styles.repoName}>{repository.name}</Text>
        {currentPath && (
          <Text style={styles.currentPath} numberOfLines={1}>
            {currentPath}
          </Text>
        )}
      </View>

      <TouchableOpacity
        style={styles.newFileButton}
        onPress={() => setShowNewFileModal(true)}
      >
        <Text style={styles.newFileButtonText}>+</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && items.length === 0) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#0366d6" />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => loadFiles(currentPath)}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}

      {items.length === 0 ? (
        <View style={styles.centerContent}>
          <Text style={styles.emptyText}>No files in this directory</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={item => item.path}
          contentContainerStyle={styles.listContent}
        />
      )}

      <Modal
        visible={showNewFileModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowNewFileModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New File</Text>

            {currentPath && (
              <Text style={styles.currentPathLabel}>
                In: {currentPath}/
              </Text>
            )}

            <TextInput
              style={styles.input}
              value={newFileName}
              onChangeText={text => {
                setNewFileName(text);
                setNewFileError(null);
              }}
              placeholder="filename.md"
              placeholderTextColor="#999"
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
            />

            {newFileError && <Text style={styles.errorText}>{newFileError}</Text>}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowNewFileModal(false);
                  setNewFileName('');
                  setNewFileError(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleCreateFile}
              >
                <Text style={styles.confirmButtonText}>Create</Text>
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e4e8',
    gap: 12,
  },
  backButton: {
    paddingVertical: 8,
  },
  backButtonText: {
    fontSize: 18,
    color: '#0366d6',
    fontWeight: '600',
  },
  titleContainer: {
    flex: 1,
  },
  repoName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#24292e',
  },
  currentPath: {
    fontSize: 12,
    color: '#586069',
    marginTop: 2,
  },
  newFileButton: {
    backgroundColor: '#0366d6',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newFileButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '300',
  },
  listContent: {
    padding: 8,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f6f8fa',
    borderRadius: 8,
    marginVertical: 4,
    marginHorizontal: 8,
  },
  fileIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    color: '#24292e',
    fontWeight: '500',
  },
  fileSize: {
    fontSize: 12,
    color: '#586069',
    marginTop: 2,
  },
  chevron: {
    fontSize: 24,
    color: '#959da5',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#586069',
  },
  errorText: {
    fontSize: 14,
    color: '#d73a49',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#0366d6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
    marginBottom: 8,
  },
  currentPathLabel: {
    fontSize: 14,
    color: '#586069',
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
