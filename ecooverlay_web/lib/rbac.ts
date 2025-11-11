// Role-Based Access Control (RBAC) System

export enum Role {
  USER = 'user',
  PREMIUM = 'premium',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
}

export enum Permission {
  // Product permissions
  READ_PRODUCTS = 'read:products',
  CREATE_PRODUCTS = 'create:products',
  UPDATE_PRODUCTS = 'update:products',
  DELETE_PRODUCTS = 'delete:products',
  
  // Footprint permissions
  READ_FOOTPRINTS = 'read:footprints',
  CREATE_FOOTPRINTS = 'create:footprints',
  UPDATE_FOOTPRINTS = 'update:footprints',
  VERIFY_FOOTPRINTS = 'verify:footprints',
  
  // Scan permissions
  CREATE_SCAN = 'create:scan',
  READ_OWN_SCANS = 'read:own-scans',
  READ_ALL_SCANS = 'read:all-scans',
  
  // User data permissions
  READ_OWN_DATA = 'read:own-data',
  UPDATE_OWN_DATA = 'update:own-data',
  DELETE_OWN_DATA = 'delete:own-data',
  EXPORT_OWN_DATA = 'export:own-data',
  
  // Analytics permissions
  READ_OWN_ANALYTICS = 'read:own-analytics',
  READ_ALL_ANALYTICS = 'read:all-analytics',
  EXPORT_ANALYTICS = 'export:analytics',
  
  // API permissions
  API_ACCESS = 'api:access',
  API_WRITE = 'api:write',
  
  // Admin permissions
  MANAGE_USERS = 'manage:users',
  MANAGE_ROLES = 'manage:roles',
  MANAGE_SYSTEM = 'manage:system',
  VIEW_AUDIT_LOGS = 'view:audit-logs',
  
  // Moderation permissions
  MODERATE_CONTENT = 'moderate:content',
  BAN_USERS = 'ban:users',
}

// Define role permissions
const rolePermissions: Record<Role, Permission[]> = {
  [Role.USER]: [
    Permission.READ_PRODUCTS,
    Permission.READ_FOOTPRINTS,
    Permission.CREATE_SCAN,
    Permission.READ_OWN_SCANS,
    Permission.READ_OWN_DATA,
    Permission.UPDATE_OWN_DATA,
    Permission.DELETE_OWN_DATA,
    Permission.EXPORT_OWN_DATA,
    Permission.READ_OWN_ANALYTICS,
  ],
  
  [Role.PREMIUM]: [],
  [Role.MODERATOR]: [],
  [Role.ADMIN]: [],
}

// Build permission hierarchy
rolePermissions[Role.PREMIUM] = [
  ...rolePermissions[Role.USER],
  Permission.EXPORT_ANALYTICS,
  Permission.API_ACCESS,
]

rolePermissions[Role.MODERATOR] = [
  ...rolePermissions[Role.PREMIUM],
  Permission.CREATE_PRODUCTS,
  Permission.UPDATE_PRODUCTS,
  Permission.CREATE_FOOTPRINTS,
  Permission.UPDATE_FOOTPRINTS,
  Permission.VERIFY_FOOTPRINTS,
  Permission.READ_ALL_SCANS,
  Permission.MODERATE_CONTENT,
  Permission.READ_ALL_ANALYTICS,
]

rolePermissions[Role.ADMIN] = [
  ...rolePermissions[Role.MODERATOR],
  Permission.DELETE_PRODUCTS,
  Permission.API_WRITE,
  Permission.MANAGE_USERS,
  Permission.MANAGE_ROLES,
  Permission.MANAGE_SYSTEM,
  Permission.VIEW_AUDIT_LOGS,
  Permission.BAN_USERS,
]

// Check if a role has a specific permission
export function hasPermission(role: Role, permission: Permission): boolean {
  const permissions = rolePermissions[role] || []
  return permissions.includes(permission)
}

// Check if a role has any of the specified permissions
export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(role, permission))
}

// Check if a role has all of the specified permissions
export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(role, permission))
}

// Get all permissions for a role
export function getRolePermissions(role: Role): Permission[] {
  return rolePermissions[role] || []
}

// Check if a role is at least a certain level
export function isRoleAtLeast(userRole: Role, requiredRole: Role): boolean {
  const roleHierarchy = [Role.USER, Role.PREMIUM, Role.MODERATOR, Role.ADMIN]
  const userIndex = roleHierarchy.indexOf(userRole)
  const requiredIndex = roleHierarchy.indexOf(requiredRole)
  
  return userIndex >= requiredIndex
}

// Feature flags based on subscription
export interface FeatureFlags {
  maxScansPerDay: number
  canExportData: boolean
  canAccessAPI: boolean
  canViewAdvancedAnalytics: boolean
  canCompareProducts: boolean
  historyRetentionDays: number
  prioritySupport: boolean
  earlyAccess: boolean
  canUseARFeatures: boolean
  canSetGoals: boolean
}

export function getFeatureFlags(role: Role, subscription?: string): FeatureFlags {
  const isPremium = role === Role.PREMIUM || subscription === 'premium'
  
  if (role === Role.ADMIN || role === Role.MODERATOR) {
    return {
      maxScansPerDay: -1,
      canExportData: true,
      canAccessAPI: true,
      canViewAdvancedAnalytics: true,
      canCompareProducts: true,
      historyRetentionDays: -1,
      prioritySupport: true,
      earlyAccess: true,
      canUseARFeatures: true,
      canSetGoals: true,
    }
  }
  
  if (isPremium) {
    return {
      maxScansPerDay: -1,
      canExportData: true,
      canAccessAPI: true,
      canViewAdvancedAnalytics: true,
      canCompareProducts: true,
      historyRetentionDays: -1,
      prioritySupport: true,
      earlyAccess: true,
      canUseARFeatures: true,
      canSetGoals: true,
    }
  }
  
  // Free tier
  return {
    maxScansPerDay: 50,
    canExportData: false,
    canAccessAPI: false,
    canViewAdvancedAnalytics: false,
    canCompareProducts: false,
    historyRetentionDays: 7,
    prioritySupport: false,
    earlyAccess: false,
    canUseARFeatures: false,
    canSetGoals: false,
  }
}

// Authorization error
export class AuthorizationError extends Error {
  constructor(
    message: string = 'Insufficient permissions',
    public permission?: Permission,
    public requiredRole?: Role
  ) {
    super(message)
    this.name = 'AuthorizationError'
  }
}

// Middleware helper to check permissions
export function requirePermission(...permissions: Permission[]) {
  return (userRole: Role) => {
    if (!hasAllPermissions(userRole, permissions)) {
      const permList = permissions.join(', ')
      throw new AuthorizationError(
        `Missing required permissions: ${permList}`,
        permissions[0]
      )
    }
    return true
  }
}

// Middleware helper to check role
export function requireRole(requiredRole: Role) {
  return (userRole: Role) => {
    if (!isRoleAtLeast(userRole, requiredRole)) {
      throw new AuthorizationError(
        `Requires at least ${requiredRole} role`,
        undefined,
        requiredRole
      )
    }
    return true
  }
}

// Get user role from database or session
export async function getUserRole(userId: string): Promise<Role> {
  try {
    const { prisma } = await import('@/lib/prisma')
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    })
    
    return (user?.role as Role) || Role.USER
  } catch (error) {
    console.error('Error fetching user role:', error)
    return Role.USER
  }
}

// Check if user can perform action
export async function can(
  userId: string,
  permission: Permission
): Promise<boolean> {
  const role = await getUserRole(userId)
  return hasPermission(role, permission)
}

// Assert user can perform action (throws if not)
export async function authorize(
  userId: string,
  permission: Permission
): Promise<void> {
  const canPerform = await can(userId, permission)
  if (!canPerform) {
    throw new AuthorizationError(
      `User ${userId} lacks permission: ${permission}`,
      permission
    )
  }
}

// Rate limit based on role
export function getRateLimitForRole(role: Role): { requests: number; window: string } {
  switch (role) {
    case Role.ADMIN:
    case Role.MODERATOR:
      return { requests: 1000, window: '15 m' }
    
    case Role.PREMIUM:
      return { requests: 500, window: '15 m' }
    
    case Role.USER:
    default:
      return { requests: 100, window: '15 m' }
  }
}
