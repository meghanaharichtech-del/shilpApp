/**
 * Validate mobile number format.
 * @param {string} mobileNumber
 * @returns {boolean}
 */
export const mobileNumberValidator = (phone) => {
    if (!phone || phone.trim().length === 0) return "* Phone number cannot be empty"; 
    if (phone.length < 8 || phone.length > 12) return "* Please enter a valid phone number "; 
    if (!/^\d+$/.test(phone)) return "* Phone number can only contain digits"; 
    return ""; 
  };
  export const mobileNumberValidatorNotRequired = (phone) => {
    if (!phone || phone.trim().length === 0) return true;
    if (phone.length < 8 || phone.length > 12) return false; 
    if (!/^\d+$/.test(phone)) return false; 
    return true; 
  };
  