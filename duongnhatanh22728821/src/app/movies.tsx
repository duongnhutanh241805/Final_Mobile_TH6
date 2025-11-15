import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { Link } from 'expo-router';
import { getMovies, addMovie } from '../services/db';

interface Movie {
  id: number;
  title: string;
  year: number;
  watched: number;
  rating: number;
  created_at: number;
}

interface MovieForm {
  title: string;
  year: string;
  rating: string;
}

export default function MoviesScreen() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState<MovieForm>({
    title: '',
    year: '',
    rating: ''
  });
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadMovies();
  }, []);

  const loadMovies = async () => {
    try {
      setLoading(true);
      const moviesData = await getMovies();
      setMovies(moviesData || []);
      setError(null);
    } catch (err) {
      setError('Lỗi khi tải danh sách phim');
      console.error('Error loading movies:', err);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};

    // Validate title (required)
    if (!formData.title.trim()) {
      errors.title = 'Tiêu đề không được để trống';
    }

    // Validate year (optional but must be valid if provided)
    if (formData.year.trim()) {
      const year = parseInt(formData.year);
      const currentYear = new Date().getFullYear();
      
      if (isNaN(year) || year < 1900 || year > currentYear) {
        errors.year = `Năm phải từ 1900 đến ${currentYear}`;
      }
    }

    // Validate rating (optional but must be valid if provided)
    if (formData.rating.trim()) {
      const rating = parseInt(formData.rating);
      if (isNaN(rating) || rating < 1 || rating > 10) {
        errors.rating = 'Đánh giá phải từ 1 đến 10';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      const movieData = {
        title: formData.title.trim(),
        year: formData.year.trim() ? parseInt(formData.year) : undefined,
        rating: formData.rating.trim() ? parseInt(formData.rating) : undefined,
        watched: 0, // Mặc định chưa xem
        created_at: Date.now()
      };

      await addMovie(movieData);
      
      // Đóng modal và reset form
      setModalVisible(false);
      setFormData({ title: '', year: '', rating: '' });
      setFormErrors({});
      
      // Reload danh sách phim
      await loadMovies();
      
      Alert.alert('Thành công', 'Đã thêm phim mới thành công!');
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể thêm phim mới');
      console.error('Error adding movie:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof MovieForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const openAddModal = () => {
    setFormData({ title: '', year: '', rating: '' });
    setFormErrors({});
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setFormData({ title: '', year: '', rating: '' });
    setFormErrors({});
  };

  const renderMovieItem = ({ item }: { item: Movie }) => (
    <View style={styles.movieCard}>
      <View style={styles.movieHeader}>
        <Text style={styles.title}>{item.title}</Text>
        {item.rating && (
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingText}>{item.rating}/10</Text>
          </View>
        )}
      </View>
      
      <View style={styles.movieDetails}>
        <Text style={styles.year}>Năm: {item.year}</Text>
        <View style={styles.watchedContainer}>
          <View 
            style={[
              styles.watchedDot, 
              item.watched ? styles.watched : styles.notWatched
            ]} 
          />
          <Text style={styles.watchedText}>
            {item.watched ? 'Đã xem' : 'Chưa xem'}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>
        Chưa có phim nào trong danh sách.
      </Text>
      <TouchableOpacity style={styles.refreshButton} onPress={loadMovies}>
        <Text style={styles.refreshButtonText}>Thử lại</Text>
      </TouchableOpacity>
    </View>
  );

  const renderAddMovieModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={closeModal}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Thêm phim mới</Text>
            <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tiêu đề *</Text>
              <TextInput
                style={[
                  styles.input,
                  formErrors.title && styles.inputError
                ]}
                value={formData.title}
                onChangeText={(value) => handleInputChange('title', value)}
                placeholder="Nhập tiêu đề phim"
                placeholderTextColor="#999"
              />
              {formErrors.title && (
                <Text style={styles.errorText}>{formErrors.title}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Năm phát hành</Text>
              <TextInput
                style={[
                  styles.input,
                  formErrors.year && styles.inputError
                ]}
                value={formData.year}
                onChangeText={(value) => handleInputChange('year', value)}
                placeholder="VD: 2024"
                placeholderTextColor="#999"
                keyboardType="numeric"
                maxLength={4}
              />
              {formErrors.year && (
                <Text style={styles.errorText}>{formErrors.year}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Đánh giá (1-10)</Text>
              <TextInput
                style={[
                  styles.input,
                  formErrors.rating && styles.inputError
                ]}
                value={formData.rating}
                onChangeText={(value) => handleInputChange('rating', value)}
                placeholder="VD: 8"
                placeholderTextColor="#999"
                keyboardType="numeric"
                maxLength={2}
              />
              {formErrors.rating && (
                <Text style={styles.errorText}>{formErrors.rating}</Text>
              )}
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={closeModal}
              disabled={submitting}
            >
              <Text style={styles.cancelButtonText}>Hủy</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.submitButton,
                submitting && styles.submitButtonDisabled
              ]} 
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.submitButtonText}>Thêm phim</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Đang tải danh sách phim...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={loadMovies}>
          <Text style={styles.refreshButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Link href="/" style={styles.backButton}>
          <Text style={styles.backButtonText}>← Quay lại</Text>
        </Link>
        <Text style={styles.headerTitle}>Danh sách phim</Text>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={movies}
        renderItem={renderMovieItem}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={movies.length === 0 ? styles.emptyList : null}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={loadMovies}
      />

      {renderAddMovieModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#007AFF',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#ff3b30',
    textAlign: 'center',
    marginBottom: 16,
  },
  movieCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  movieHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  ratingBadge: {
    backgroundColor: '#ffd700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 50,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  movieDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  year: {
    fontSize: 14,
    color: '#666',
  },
  watchedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  watchedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  watched: {
    backgroundColor: '#4CAF50',
  },
  notWatched: {
    backgroundColor: '#ff9800',
  },
  watchedText: {
    fontSize: 14,
    color: '#666',
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  refreshButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
    lineHeight: 24,
  },
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  inputError: {
    borderColor: '#ff3b30',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
});