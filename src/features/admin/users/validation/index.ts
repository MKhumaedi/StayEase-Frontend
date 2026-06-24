export interface UserFormErrors {
  name?: string;
  email?: string;
  role?: string;
  password?: string;
}

export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

export function validateUserCreate(data: { name: string; email: string; role: string; password?: string }): UserFormErrors {
  const errors: UserFormErrors = {};
  if (!data.name.trim()) errors.name = 'Full name is required';
  if (!data.email.trim()) {
    errors.email = 'Email is required';
  } else if (!validateEmail(data.email)) {
    errors.email = 'Enter a valid email address';
  }
  if (!data.role) {
    errors.role = 'Role is required';
  } else if (!['USER', 'TENANT', 'ADMIN'].includes(data.role)) {
    errors.role = 'Invalid role assignment';
  }
  if (data.password !== undefined && (!data.password || data.password.length < 6)) {
    errors.password = 'Password must be at least 6 characters';
  }
  return errors;
}

export function validateUserEdit(data: { name: string; email: string; role: string }): UserFormErrors {
  const errors: UserFormErrors = {};
  if (!data.name.trim()) errors.name = 'Full name is required';
  if (!data.email.trim()) {
    errors.email = 'Email is required';
  } else if (!validateEmail(data.email)) {
    errors.email = 'Enter a valid email address';
  }
  if (!data.role) {
    errors.role = 'Role is required';
  } else if (!['USER', 'TENANT', 'ADMIN'].includes(data.role)) {
    errors.role = 'Invalid role assignment';
  }
  return errors;
}
