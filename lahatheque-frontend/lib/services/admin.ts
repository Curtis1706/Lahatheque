import {
  AdminKpi,
  AdminUser,
  RoleDistribution,
  RevenueCategoryBreakdown,
  AdminCatalogBook,
  AdminSale,
  AdminRoyalty,
  AdminReminder,
  AdminAccessLog,
  AdminRole,
} from "@/lib/types/admin";
import {
  MOCK_ADMIN_KPI,
  MOCK_ROLE_DISTRIBUTION,
  MOCK_REVENUE_BREAKDOWN,
  MOCK_ADMIN_USERS,
  MOCK_ADMIN_BOOKS,
  MOCK_ADMIN_SALES,
  MOCK_ADMIN_ROYALTIES,
  MOCK_ADMIN_REMINDERS,
  MOCK_ADMIN_LOGS,
} from "@/lib/mock/admin";

export async function getAdminKpis(): Promise<AdminKpi> {
  await new Promise((res) => setTimeout(res, 350));
  return MOCK_ADMIN_KPI;
}

export async function getRoleDistribution(): Promise<RoleDistribution[]> {
  await new Promise((res) => setTimeout(res, 300));
  return MOCK_ROLE_DISTRIBUTION;
}

export async function getRevenueCategoryBreakdown(): Promise<RevenueCategoryBreakdown[]> {
  await new Promise((res) => setTimeout(res, 300));
  return MOCK_REVENUE_BREAKDOWN;
}

export async function getAdminUsers(roleFilter?: AdminRole): Promise<AdminUser[]> {
  await new Promise((res) => setTimeout(res, 400));
  if (roleFilter) {
    return MOCK_ADMIN_USERS.filter((u) => u.role === roleFilter || u.active_roles.includes(roleFilter));
  }
  return MOCK_ADMIN_USERS;
}

export async function getAdminCatalog(): Promise<AdminCatalogBook[]> {
  await new Promise((res) => setTimeout(res, 400));
  return MOCK_ADMIN_BOOKS;
}

export async function getAdminSales(): Promise<AdminSale[]> {
  await new Promise((res) => setTimeout(res, 400));
  return MOCK_ADMIN_SALES;
}

export async function getAdminRoyalties(): Promise<AdminRoyalty[]> {
  await new Promise((res) => setTimeout(res, 350));
  return MOCK_ADMIN_ROYALTIES;
}

export async function getAdminReminders(): Promise<AdminReminder[]> {
  await new Promise((res) => setTimeout(res, 350));
  return MOCK_ADMIN_REMINDERS;
}

export async function getAdminLogs(): Promise<AdminAccessLog[]> {
  await new Promise((res) => setTimeout(res, 400));
  return MOCK_ADMIN_LOGS;
}
