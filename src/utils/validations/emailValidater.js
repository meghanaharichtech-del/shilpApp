/**
 * Validate email format.
 * @param {string} email - The email address to validate.
 * @returns {boolean} - Returns true if the email format is valid, otherwise false.
 */
export const emailValidater = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

