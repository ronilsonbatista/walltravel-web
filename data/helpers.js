import vitrineData from './vitrine.json';

// Categories Helpers
export const getCategories = () => vitrineData.categories;
export const getFeaturedCategories = () => vitrineData.categories.filter(c => c.featured);
export const getCategoryBySlug = (slug) => vitrineData.categories.find(c => c.slug === slug);

// Packages Helpers
export const getPackagesByCategory = (categorySlug) => {
  // Return packages matching the category slug, or check if the tag matches
  return vitrineData.packages.filter(p => p.categorySlug === categorySlug || (categorySlug === 'lua-de-mel' && p.tags.includes('lua-de-mel')));
};
export const getPackageBySlug = (slug) => vitrineData.packages.find(p => p.slug === slug);
export const getFeaturedPackages = () => vitrineData.packages.filter(p => p.featured);

// Hero Slideshow Helpers
export const getHeroSlides = () => vitrineData.heroSlides;
export const getHeroSlideById = (id) => vitrineData.heroSlides.find(s => s.id === id);
export const getOrderedHeroSlides = () => [...vitrineData.heroSlides].sort((a, b) => a.order - b.order);

// Honeymoon Helpers
export const getHoneymoonSection = () => vitrineData.homeSections.honeymoon;
export const getHoneymoonPackages = () => vitrineData.packages.filter(p => p.tags.includes('lua-de-mel'));
export const getPackagesByTag = (tag) => vitrineData.packages.filter(p => p.tags.includes(tag));
