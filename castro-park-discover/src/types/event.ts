export interface Event {
  id: string;
  title: string;
  description: string | null;
  image: string | null;
  address: string | null;
  link: string | null;
  startDate: string;
  endDate: string | null;
  category: string | null;
}
