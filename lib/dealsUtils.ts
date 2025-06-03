export interface Deal {
  id: string;
  status: 'Active' | 'Closed';
  service_type: 'Owner' | 'Tenant';
  customer: string;
  location: string;
  size: number;
  cost_or_budget: number;
  revenue_from_owner: number;
  revenue_from_tenant: number;
  total_revenue: number;
  notes: string;
  property_or_inquiry_link: string;
  start_date?: string;
  closed_date?: string | null;
  created_by: string;
}
