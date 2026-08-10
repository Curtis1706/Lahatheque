import { StudentOrder } from '../types/student-orders';
import { MOCK_STUDENT_ORDERS } from '../mock/student-orders';

export async function fetchStudentOrders(): Promise<StudentOrder[]> {
  try {
    const res = await fetch("/api/bff/commerce/orders/my/", { 
      cache: "no-store",
      headers: { "Content-Type": "application/json" }
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.warn("BFF backend non joignable pour mes commandes, fallback sur les données mockées:", err);
  }
  
  // Simuler un léger délai réseau pour l'UX loading state
  await new Promise(resolve => setTimeout(resolve, 350));
  return MOCK_STUDENT_ORDERS;
}

export async function fetchOrderDetail(orderId: string): Promise<StudentOrder | null> {
  try {
    const res = await fetch(`/api/bff/commerce/orders/${orderId}/`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    console.warn("BFF backend non joignable pour le détail de commande, fallback sur mock:", err);
  }

  await new Promise(resolve => setTimeout(resolve, 200));
  return MOCK_STUDENT_ORDERS.find(o => o.id === orderId) || null;
}
