import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator,
  TouchableOpacity 
} from 'react-native';
import { Link } from 'expo-router';
import { getMovies } from '../services/db';

interface Movie {
  id: number;
  title: string;
  year: number;
  watched: number;
  rating: number;
  created_at: number;
}

export default function MoviesScreen() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        <TouchableOpacity style={styles.refreshButton} onPress={loadMovies}>
          <Text style={styles.refreshButtonText}>Làm mới</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={movies}
        renderItem={renderMovieItem}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={movies.length === 0 ? styles.emptyList : null}
        showsVerticalScrollIndicator={false}
      />
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
});