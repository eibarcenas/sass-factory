output "bucket_name" { value = google_storage_bucket.this.name }
output "public_url"  { value = "https://storage.googleapis.com/${google_storage_bucket.this.name}" }
output "id"          { value = google_storage_bucket.this.id }
