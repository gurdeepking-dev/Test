
const FREE_PHOTO_USED_KEY = 'styleswap_free_photo_claimed';

export const usageService = {
  hasClaimedFreePhoto: (): boolean => {
    return localStorage.getItem(FREE_PHOTO_USED_KEY) === 'true';
  },

  markFreePhotoAsUsed: () => {
    localStorage.setItem(FREE_PHOTO_USED_KEY, 'true');
  }
};
