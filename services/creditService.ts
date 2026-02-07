
const GUEST_CREDIT_USED_KEY = 'styleswap_guest_free_used';
const USER_CREDITS_PREFIX = 'styleswap_credits_';

export const creditService = {
  getGuestCredits: (): number => {
    const used = localStorage.getItem(GUEST_CREDIT_USED_KEY);
    return used ? 0 : 1;
  },

  getUserCredits: (email: string): number => {
    const key = USER_CREDITS_PREFIX + email;
    const credits = localStorage.getItem(key);
    if (credits === null) {
      // First time login bonus
      localStorage.setItem(key, '2');
      return 2;
    }
    return parseInt(credits, 10);
  },

  spendCredit: (email?: string): boolean => {
    if (email) {
      const current = creditService.getUserCredits(email);
      if (current > 0) {
        localStorage.setItem(USER_CREDITS_PREFIX + email, (current - 1).toString());
        return true;
      }
    } else {
      if (creditService.getGuestCredits() > 0) {
        localStorage.setItem(GUEST_CREDIT_USED_KEY, 'true');
        return true;
      }
    }
    return false;
  },

  addCredits: (email: string, amount: number) => {
    const current = creditService.getUserCredits(email);
    localStorage.setItem(USER_CREDITS_PREFIX + email, (current + amount).toString());
  }
};
