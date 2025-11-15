import { Platform } from "react-native";
import { openDatabaseAsync } from "expo-sqlite";

let db: any;

// Initialize database
export const initDB = async () => {
  try {
    if (Platform.OS === "web") {
      // Web: sử dụng Dexie (IndexedDB)
      const { default: Dexie } = await import("dexie");
      db = new Dexie("moviesDB");
      db.version(1).stores({
        movies: "++id",
      });

      // Seed data nếu là lần đầu
      const count = await db.movies.count();
      if (count === 0) {
        const now = Date.now();
        await db.movies.bulkAdd([
          {
            title: "Inception",
            year: 2010,
            watched: 0,
            rating: 9,
            created_at: now,
          },
          {
            title: "Interstellar",
            year: 2014,
            watched: 0,
            rating: 9,
            created_at: now,
          },
        ]);
        console.log("Seeded 2 sample movies (web)");
      }
      return true;
    } else {
      // Mobile: sử dụng SQLite
      db = await openDatabaseAsync("movies.db");

      // Tạo bảng
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS movies (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          year INTEGER,
          watched INTEGER DEFAULT 0,
          rating INTEGER,
          created_at INTEGER
        );
      `);

      // Kiểm tra và seed data
      const result = await db.getFirstAsync(
        "SELECT COUNT(*) as count FROM movies"
      );
      const count = (result as any)?.count || 0;

      if (count === 0) {
        const now = Date.now();
        await db.execAsync(
          `INSERT INTO movies (title, year, watched, rating, created_at) VALUES 
          ('Inception', 2010, 0, 9, ${now}),
          ('Interstellar', 2014, 0, 9, ${now});`
        );
        console.log("Seeded 2 sample movies (mobile)");
      }

      return true;
    }
  } catch (error) {
    console.error("Database initialization error:", error);
    throw error;
  }
};

// Hàm lấy tất cả movies
export const getMovies = async () => {
  try {
    if (Platform.OS === "web") {
      return await db.movies.toArray();
    } else {
      const result = await db.getAllAsync("SELECT * FROM movies");
      return result || [];
    }
  } catch (error) {
    console.error("Error fetching movies:", error);
    return [];
  }
};

// Hàm thêm movie
export const addMovie = async (movie: {
  title: string;
  year?: number;
  watched?: number;
  rating?: number;
  created_at?: number;
}) => {
  try {
    const now = Date.now();
    const movieData = {
      ...movie,
      created_at: movie.created_at || now,
    };

    if (Platform.OS === "web") {
      return await db.movies.add(movieData);
    } else {
      const result = await db.runAsync(
        `INSERT INTO movies (title, year, watched, rating, created_at) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          movieData.title,
          movieData.year || null,
          movieData.watched || 0,
          movieData.rating || null,
          movieData.created_at,
        ]
      );
      return result.lastInsertRowId;
    }
  } catch (error) {
    console.error("Error adding movie:", error);
    throw error;
  }
};