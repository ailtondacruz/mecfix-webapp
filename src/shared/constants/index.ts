export const ROLES = {
  ROOT: 'root',
  ADMIN: 'admin',
  OWNER: 'owner',
  MECHANIC: 'mechanic',
  ATTENDANT: 'attendant',
} as const;

export const PERMISSIONS = {
  CREATE_WORKSHOP: 'create:workshop',
  READ_WORKSHOP: 'read:workshop',
  UPDATE_WORKSHOP: 'update:workshop',
  DELETE_WORKSHOP: 'delete:workshop',
  
  CREATE_USER: 'create:user',
  READ_USER: 'read:user',
  UPDATE_USER: 'update:user',
  DELETE_USER: 'delete:user',
  
  CREATE_BUDGET: 'create:budget',
  READ_BUDGET: 'read:budget',
  UPDATE_BUDGET: 'update:budget',
  DELETE_BUDGET: 'delete:budget',
  
  CREATE_CUSTOMER: 'create:customer',
  READ_CUSTOMER: 'read:customer',
  UPDATE_CUSTOMER: 'update:customer',
  DELETE_CUSTOMER: 'delete:customer',
  
  READ_FINANCIALS: 'read:financials',
  CREATE_FINANCIAL: 'create:financial',
  EXPORT_FINANCIALS: 'export:financials',
} as const;

export const ROUTES = {
  AUTH: '/auth',
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  
  ADMIN: '/admin',
  ADMIN_WORKSHOPS: '/admin/workshops',
  
  WORKSHOP: '/workshop',
  CUSTOMERS: '/workshop/customers',
  VEHICLES: '/workshop/vehicles',
  BUDGETS: '/workshop/budgets',
  FINANCIALS: '/workshop/financials',
} as const;

export const API_ENDPOINTS = {
  AUTH_LOGIN: '/api/auth/login',
  AUTH_REGISTER: '/api/auth/register',
  AUTH_LOGOUT: '/api/auth/logout',
  
  WORKSHOPS: '/api/workshops',
  WORKSHOPS_BY_ID: (id: string) => `/api/workshops/${id}`,
  
  USERS: (workshopId: string) => `/api/workshops/${workshopId}/users`,
  USERS_BY_ID: (workshopId: string, userId: string) => `/api/workshops/${workshopId}/users/${userId}`,
  
  CUSTOMERS: (workshopId: string) => `/api/workshops/${workshopId}/customers`,
  CUSTOMERS_BY_ID: (workshopId: string, customerId: string) => `/api/workshops/${workshopId}/customers/${customerId}`,
  
  VEHICLES: (workshopId: string) => `/api/workshops/${workshopId}/vehicles`,
  VEHICLES_BY_ID: (workshopId: string, vehicleId: string) => `/api/workshops/${workshopId}/vehicles/${vehicleId}`,
  
  BUDGETS: '/api/budgets',
  BUDGETS_BY_ID: (budgetId: string) => `/api/budgets/${budgetId}`,
  BUDGETS_PDF: (budgetId: string) => `/api/budgets/${budgetId}/pdf`,
  
  FINANCIALS: (workshopId: string) => `/api/workshops/${workshopId}/financials`,
  FINANCIALS_EXPORT: (workshopId: string) => `/api/workshops/${workshopId}/financials/export`,
} as const;
