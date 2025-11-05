import React, { useState, useEffect } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, View } from 'react-native';
import { Provider, useSelector } from 'react-redux';
import { store } from './store';
import { RootState } from './store';
import { AuthScreen } from './screens/AuthScreen';
import { RepositoryListScreen } from './screens/RepositoryListScreen';
import { FileBrowserScreen } from './screens/FileBrowserScreen';
import { EditorScreen } from './screens/EditorScreen';
import { Repository, FileItem } from './types';
import { useSyncManager } from './utils/useSyncManager';

type Screen =
  | { type: 'auth' }
  | { type: 'repositories' }
  | { type: 'files'; repository: Repository }
  | { type: 'editor'; repository: Repository; file: FileItem };

const AppContent: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>({ type: 'auth' });
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  // Initialize sync manager
  useSyncManager();

  useEffect(() => {
    if (!isAuthenticated) {
      setCurrentScreen({ type: 'auth' });
    }
  }, [isAuthenticated]);

  const handleAuthenticated = () => {
    setCurrentScreen({ type: 'repositories' });
  };

  const handleSelectRepository = (repository: Repository) => {
    setCurrentScreen({ type: 'files', repository });
  };

  const handleSelectFile = (repository: Repository, file: FileItem) => {
    setCurrentScreen({ type: 'editor', repository, file });
  };

  const handleBackToRepositories = () => {
    setCurrentScreen({ type: 'repositories' });
  };

  const handleBackToFiles = (repository: Repository) => {
    setCurrentScreen({ type: 'files', repository });
  };

  const renderScreen = () => {
    switch (currentScreen.type) {
      case 'auth':
        return <AuthScreen onAuthenticated={handleAuthenticated} />;

      case 'repositories':
        return <RepositoryListScreen onSelectRepository={handleSelectRepository} />;

      case 'files':
        return (
          <FileBrowserScreen
            repository={currentScreen.repository}
            onSelectFile={(file) => handleSelectFile(currentScreen.repository, file)}
            onBack={handleBackToRepositories}
          />
        );

      case 'editor':
        return (
          <EditorScreen
            file={currentScreen.file}
            repository={currentScreen.repository}
            onBack={() => handleBackToFiles(currentScreen.repository)}
          />
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      {renderScreen()}
    </SafeAreaView>
  );
};

export default function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
