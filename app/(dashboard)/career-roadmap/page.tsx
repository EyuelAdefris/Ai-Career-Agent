'use client';

import { redirect } from 'next/navigation';

export default function RedirectToDashboard() {
  redirect('/dashboard');
  return null;
}
