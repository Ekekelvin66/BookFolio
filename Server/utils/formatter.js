export const professionalTitleCase=(str)=> {
  const smallWords = /^(a|an|and|as|at|but|by|en|for|if|in|of|on|or|the|to|v\.?|via)$/i;

  return str.toLowerCase().split(' ').map((word, index, array) => {
    if (index > 0 && index < array.length - 1 && word.match(smallWords)) {
      return word.toLowerCase();
    }
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
}

export const stripHtmlTags = (htmlString) => {
  if (!htmlString) return '';
  return htmlString
    .replace(/<\/p>\s*<p>/gi, '\n\n')
    .replace(/<[^>]*>/g, '')         
    .trim();                         
};