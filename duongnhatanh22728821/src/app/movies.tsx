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
import { 
  getMovies, 
  addMovie, 
  toggleWatched, 
  getMovieById, 
  updateMovie, 
  deleteMovie 
} from '../services/db';
import { Movie } from '../services/db';

interface MovieForm {
  title: string;
  year: string;
  rating: string;
}

export default function MoviesScreen() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [formData, setFormData] = useState<MovieForm>({
    title: '',
    year: '',
    rating: ''
  });
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

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

  const handleToggleWatched = async (movie: Movie) => {
    try {
      setTogglingId(movie.id);
      await toggleWatched(movie.id, movie.watched);
      
      setMovies(prevMovies => 
        prevMovies.map(m => 
          m.id === movie.id 
            ? { ...m, watched: m.watched ? 0 : 1 }
            : m
        )
      );
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái');
      console.error('Error toggling watched:', err);
    } finally {
      setTogglingId(null);
    }
  };

  const handleEditMovie = async (movie: Movie) => {
    try {
      const movieDetail = await getMovieById(movie.id);
      if (movieDetail) {
        setEditingMovie(movieDetail);
        setFormData({
          title: movieDetail.title,
          year: movieDetail.year?.toString() || '',
          rating: movieDetail.rating?.toString() || ''
        });
        setFormErrors({});
        setEditModalVisible(true);
      }
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể tải thông tin phim');
      console.error('Error loading movie details:', err);
    }
  };

  const handleDeleteMovie = (movie: Movie) => {
    Alert.alert(
      'Xác nhận xóa',
      `Bạn có chắc muốn xóa phim "${movie.title}"?`,
      [
        {
          text: 'Hủy',
          style: 'cancel'
        },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => confirmDeleteMovie(movie.id)
        }
      ]
    );
  };

  const confirmDeleteMovie = async (id: number) => {
    try {
      setDeletingId(id);
      await deleteMovie(id);
      
      // Cập nhật UI ngay lập tức
      setMovies(prevMovies => prevMovies.filter(movie => movie.id !== id));
      
      Alert.alert('Thành công', 'Đã xóa phim thành công');
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể xóa phim');
      console.error('Error deleting movie:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleLongPress = (movie: Movie) => {
    Alert.alert(
      'Tùy chọn',
      `Chọn hành động cho "${movie.title}"`,
      [
        {
          text: 'Sửa',
          onPress: () => handleEditMovie(movie)
        },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => handleDeleteMovie(movie)
        },
        {
          text: 'Đánh dấu đã xem',
          onPress: () => handleToggleWatched(movie)
        },
        {
          text: 'Hủy',
          style: 'cancel'
        }
      ]
    );
  };

  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};

    if (!formData.title.trim()) {
      errors.title = 'Tiêu đề không được để trống';
    }

    if (formData.year.trim()) {
      const year = parseInt(formData.year);
      const currentYear = new Date().getFullYear();
      
      if (isNaN(year) || year < 1900 || year > currentYear) {
        errors.year = `Năm phải từ 1900 đến ${currentYear}`;
      }
    }

    if (formData.rating.trim()) {
      const rating = parseInt(formData.rating);
      if (isNaN(rating) || rating < 1 || rating > 10) {
        errors.rating = 'Đánh giá phải từ 1 đến 10';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      const movieData = {
        title: formData.title.trim(),
        year: formData.year.trim() ? parseInt(formData.year) : undefined,
        rating: formData.rating.trim() ? parseInt(formData.rating) : undefined,
        watched: 0,
        created_at: Date.now()
      };

      await addMovie(movieData);
      
      setAddModalVisible(false);
      setFormData({ title: '', year: '', rating: '' });
      setFormErrors({});
      
      await loadMovies();
      
      Alert.alert('Thành công', 'Đã thêm phim mới thành công!');
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể thêm phim mới');
      console.error('Error adding movie:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!validateForm() || !editingMovie) {
      return;
    }

    setSubmitting(true);
    try {
      const updates = {
        title: formData.title.trim(),
        year: formData.year.trim() ? parseInt(formData.year) : null,
        rating: formData.rating.trim() ? parseInt(formData.rating) : null,
      };

      await updateMovie(editingMovie.id, updates);
      
      setEditModalVisible(false);
      setFormData({ title: '', year: '', rating: '' });
      setFormErrors({});
      setEditingMovie(null);
      
      await loadMovies();
      
      Alert.alert('Thành công', 'Đã cập nhật thông tin phim thành công!');
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể cập nhật thông tin phim');
      console.error('Error updating movie:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof MovieForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
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
    setAddModalVisible(true);
  };

  const closeAddModal = () => {
    setAddModalVisible(false);
    setFormData({ title: '', year: '', rating: '' });
    setFormErrors({});
  };

  const closeEditModal = () => {
    setEditModalVisible(false);
    setFormData({ title: '', year: '', rating: '' });
    setFormErrors({});
    setEditingMovie(null);
  };

  const renderMovieItem = ({ item }: { item: Movie }) => (
    <TouchableOpacity
      onPress={() => handleToggleWatched(item)}
      onLongPress={() => handleLongPress(item)}
      disabled={togglingId === item.id || deletingId === item.id}
      style={[
        styles.movieCard,
        item.watched && styles.movieCardWatched,
        deletingId === item.id && styles.movieCardDeleting
      ]}
    >
      <View style={styles.movieHeader}>
        <View style={styles.titleContainer}>
          <Text style={[
            styles.title,
            item.watched && styles.titleWatched,
            deletingId === item.id && styles.textDeleting
          ]}>
            {item.title}
          </Text>
          {item.watched && (
            <View style={styles.watchedIcon}>
              <Text style={styles.watchedIconText}>✓</Text>
            </View>
          )}
        </View>
        <View style={styles.headerActions}>
          {item.rating && (
            <View style={[
              styles.ratingBadge,
              item.watched && styles.ratingBadgeWatched,
              deletingId === item.id && styles.ratingBadgeDeleting
            ]}>
              <Text style={styles.ratingText}>{item.rating}/10</Text>
            </View>
          )}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => handleEditMovie(item)}
              disabled={deletingId === item.id}
            >
              <Text style={styles.editButtonText}>Sửa</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={() => handleDeleteMovie(item)}
              disabled={deletingId === item.id}
            >
              {deletingId === item.id ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.deleteButtonText}>Xóa</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      <View style={styles.movieDetails}>
        <Text style={[
          styles.year,
          item.watched && styles.textWatched,
          deletingId === item.id && styles.textDeleting
        ]}>
          Năm: {item.year}
        </Text>
        <View style={styles.watchedContainer}>
          {togglingId === item.id ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <>
              <View 
                style={[
                  styles.watchedDot, 
                  item.watched ? styles.watched : styles.notWatched,
                  deletingId === item.id && styles.watchedDotDeleting
                ]} 
              />
              <Text style={[
                styles.watchedText,
                item.watched && styles.textWatched,
                deletingId === item.id && styles.textDeleting
              ]}>
                {item.watched ? 'Đã xem' : 'Chưa xem'}
              </Text>
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
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

  const renderMovieModal = (isEdit: boolean) => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isEdit ? editModalVisible : addModalVisible}
      onRequestClose={isEdit ? closeEditModal : closeAddModal}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isEdit ? 'Chỉnh sửa phim' : 'Thêm phim mới'}
            </Text>
            <TouchableOpacity 
              onPress={isEdit ? closeEditModal : closeAddModal} 
              style={styles.closeButton}
            >
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
              onPress={isEdit ? closeEditModal : closeAddModal}
              disabled={submitting}
            >
              <Text style={styles.cancelButtonText}>Hủy</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.submitButton,
                submitting && styles.submitButtonDisabled
              ]} 
              onPress={isEdit ? handleEditSubmit : handleAddSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {isEdit ? 'Cập nhật' : 'Thêm phim'}
                </Text>
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

      {renderMovieModal(false)} {/* Add Modal */}
      {renderMovieModal(true)}  {/* Edit Modal */}
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
  movieCardWatched: {
    backgroundColor: '#f8f9fa',
    opacity: 0.8,
  },
  movieCardDeleting: {
    backgroundColor: '#fff3cd',
    opacity: 0.6,
  },
  movieHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  titleWatched: {
    textDecorationLine: 'line-through',
    color: '#666',
  },
  textDeleting: {
    color: '#999',
  },
  watchedIcon: {
    backgroundColor: '#4CAF50',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  watchedIconText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  editButton: {
    backgroundColor: '#FFA000',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  editButtonText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    minWidth: 50,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  ratingBadge: {
    backgroundColor: '#ffd700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 50,
  },
  ratingBadgeWatched: {
    backgroundColor: '#ccc',
  },
  ratingBadgeDeleting: {
    backgroundColor: '#e0e0e0',
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
  textWatched: {
    color: '#999',
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
  watchedDotDeleting: {
    backgroundColor: '#ccc',
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