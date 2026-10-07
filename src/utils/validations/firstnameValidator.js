/**
 * Validate name format.
 * @param {string} name - The name to validate.
 * @returns {boolean} - Returns true if the name format is valid, otherwise false.
 */
// export const firstnameValidator = (name) => {
//   const nameRegex = /^[A-Za-z]+$/;
//   return nameRegex.test(name);
// };


export const firstnameValidator = (name) => {
  if (!name || name.length === 0) return false;
  const nameRegex = /^[a-zA-Z\s]{2,}$/;
  return nameRegex.test(name);};
  
  
  
  // const nameValidator = (name) => {
  //   if (!name || name.length === 0) return false;
  //   const nameRegex = /^[a-zA-Z\s]{2,}$/;
  //   return nameRegex.test(name);
  // };