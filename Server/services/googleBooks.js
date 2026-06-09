import axios from "axios";
import { stripHtmlTags } from "../utils/formatter.js";

const BASE_URL = 'https://www.googleapis.com/books/v1/volumes';

const API_KEY = process.env.GOOGLE_BOOKS_API_KEY || null;

const buildParams = (query, extra = {}) => {
  const params = {
    q:          query,
    maxResults: 10,
    orderBy:    'relevance',
    ...extra,
  };
  if (API_KEY) params.key = API_KEY;
  return params;
};

const normalizeBook = (item) => {
  const info = item.volumeInfo;

  let cover = info.imageLinks?.thumbnail || null;
  if (cover) {
    cover = cover.replace('http:', 'https:').replace('&zoom=1', '&zoom=2');
  }

  const rawDescription=info.description||'No description available'

  return {
    googleBooksId:      item.id,
    title:              info.title || 'Unknown Title',
    author:             info.authors?.[0] || 'Unknown Author',
    cover,
    cover_url:          cover,          
    description:       stripHtmlTags(rawDescription),
    genre:              info.categories || [],
    previewLink:        info.previewLink || null,
    globalRating:       info.averageRating || 0,
    pageCount:          info.pageCount || 0,
    globalRatingsCount: info.ratingsCount || 0,
    publish_date:       info.publishedDate || null,
    publish_year:       info.publishedDate 
                          ? parseInt(info.publishedDate.substring(0, 4)) || null 
                          : null
                  };          
};

export const searchGoogleBooks = async (textQuery = '', genre = '', startIndex = 0) => {
  const parts = [];
  if (textQuery) parts.push(textQuery);
  if (genre && genre !== 'All' && genre !== '') parts.push(`subject:"${genre}"`);

  const query = parts.length > 0 ? parts.join(' ') : 'subject:fiction';

  try {
    const response = await axios.get(BASE_URL, { params: buildParams(query, { startIndex }) });
    return response.data.items?.map(normalizeBook) ?? [];
  } catch (err) {
    if (err.response?.status === 429) {
      console.warn('[GoogleBooks] 429 rate limit — rethrowing for cache layer');
      throw err;
    }
    console.error('Google Books API Error:', err.message);
    return [];
  }
};

export const getGoogleBookById = async (googleBooksId) => {
  try {
    const params = {};
    if (API_KEY) params.key = API_KEY;

    const response = await axios.get(`${BASE_URL}/${googleBooksId}`, { params });
    return normalizeBook(response.data);
  } catch (err) {
    if (err.response?.status === 429) {
      console.warn('[GoogleBooks] 429 on getById — rethrowing');
      throw err;
    }
    console.error('Google Books fetch error:', err.message);
    return null;
  }
};