export class SourceHistoryItemDto {
  id: string;
  name: string;
  website_url: string | null;
  origin: 'discovered' | 'manual';
  added_at: Date;
  deleted_at: Date | null;
}
