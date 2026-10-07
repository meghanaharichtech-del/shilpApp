
/**
 * Validate password.
 * @param {string} email
 * @returns {boolean} 
 */
export const passwordValidater = (password) => {
    if (password.length >= 2) {
      return true;
    } else {
      return false;
    }
  };