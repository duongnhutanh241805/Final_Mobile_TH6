// db.ts
import { Platform } from "react-native";
import { openDatabaseAsync } from "expo-sqlite";

// Nếu trên web, dùng Dexie.js (IndexedDB)
let db: any;

if (Platform.OS === "web") {
  import("dexie").then(({ default: Dexie }) => {
    db = new Dexie("moviesDB");
    db.version(1).stores({
      movies: "++id,title,year,watched,rating,created_at",
    });
  });
} else {
  // Mobile (iOS / Android)
  // Initialize db asynchronously
}

// Hàm init DB
export const initDB = async () => {
  if (Platform.OS === "web") {
    // Dexie init đã xong khi import
    return true;
  } else {
    return new Promise((resolve, reject) => {
      db.transaction((tx: any) => {
        tx.executeSql(
          `
          CREATE TABLE IF NOT EXISTS movies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            year INTEGER,
            watched INTEGER DEFAULT 0,
            rating INTEGER,
            created_at INTEGER
          );
          `,
          [],
          () => resolve(true),
          (_, err: any) => reject(err)
        );
      });
    });
  }
};

// Hàm thêm movie (demo)
export const addMovie = async (movie: {
  title: string;
  year?: number;
  watched?: number;
  rating?: number;
  created_at?: number;
}) => {
  if (Platform.OS === "web") {
    return db.movies.add({
      ...movie,
      created_at: movie.created_at || Date.now(),
    });
  } else {
    return new Promise((resolve, reject) => {
      db.transaction((tx: any) => {
        tx.executeSql(
          `
          INSERT INTO movies (title, year, watched, rating, created_at)
          VALUES (?, ?, ?, ?, ?)
          `,
          [
            movie.title,
            movie.year || null,
            movie.watched || 0,
            movie.rating || null,
            movie.created_at || Date.now(),
          ],
          (_, result: any) => resolve(result.insertId),
          (_, err: any) => reject(err)
        );
      });
    });
  }
};

// Hàm lấy tất cả movies
export const getMovies = async () => {
  if (Platform.OS === "web") {
    return db.movies.toArray();
  } else {
    return new Promise((resolve, reject) => {
      db.transaction((tx: any) => {
        tx.executeSql(
          `SELECT * FROM movies`,
          [],
          (_, { rows }: any) => resolve(rows._array),
          (_, err: any) => reject(err)
        );
      });
    });
  }
};
