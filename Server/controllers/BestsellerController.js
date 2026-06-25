import { searchBooks } from '../services/googleBookCache.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const BESTSELLERS = [
  { title: 'Harvest Season',           author: 'Brynne Weaver' },
  { title: 'Whistler',                 author: 'Ann Patchett' },
  { title: 'Yesteryear',               author: 'Caro Claire Burke' },
  { title: 'The Calamity Club',        author: 'Kathryn Stockett' },
  { title: 'The Correspondent',        author: 'Virginia Evans' },
  { title: "Rocket's Red Glare",       author: 'James Patterson' },
  { title: 'Land',                     author: "Maggie O'Farrell" },
  { title: 'Our Perfect Storm',        author: 'Carley Fortune' },
  { title: "Carl's Doomsday Scenario", author: 'Matt Dinniman' },
];

export const fetchBestsellers = async () => {
    return Promise.all(
        BESTSELLERS.map(({title,author})=>
        searchBooks(`${title} ${author}`)
      .then(books=>books[0] ?? null)
       .catch(() => null) 
      )
      ).then(results=>results.filter(Boolean));
};

export const getBestsellers = asyncHandler(async (req, res) => {
  const bestsellers = await fetchBestsellers();
  res.json({ bestsellers });
});
