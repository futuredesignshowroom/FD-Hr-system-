// utils/validation.ts - Validation Utilities

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  return password.length >= 8;
};

export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone.replace(/[^0-9]/g, ''));
};

export const validateZipCode = (zipCode: string): boolean => {
  const zipRegex = /^[0-9]{5,6}$/;
  return zipRegex.test(zipCode);
};

export const validateName = (name: string): boolean => {
  return name.trim().length >= 2;
};

export const validateEmployeeId = (id: string): boolean => {
  return id.trim().length >= 3;
};
