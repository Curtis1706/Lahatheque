import { StudentOrder } from '../types/student-orders';

export async function fetchStudentOrders(): Promise<StudentOrder[]> {
  const res = await fetch("/api/bff/commerce/orders/my/", {
    cache: "no-store",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`Erreur commandes: ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : data.results || data.data || [];
}

export async function fetchOrderDetail(orderId: string): Promise<StudentOrder | null> {
  const res = await fetch(`/api/bff/commerce/orders/${orderId}/`, {
    cache: "no-store",
    credentials: "include",
  });
  if (!res.ok) return null;
  return await res.json();
}
