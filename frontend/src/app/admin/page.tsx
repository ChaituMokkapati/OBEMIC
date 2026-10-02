import { redirect } from 'next/navigation';

export default function AdminIndexPage() {
  // Automatically redirect the base /admin path to the dashboard
  redirect('/admin/dashboard');
}
