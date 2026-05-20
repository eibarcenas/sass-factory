output "storefront_url" { value = module.storefront.url }
output "admin_url"      { value = module.admin.url }
output "api_url"        { value = module.api.url }
output "images_bucket"  { value = module.images_bucket.bucket_name }
output "images_cdn_url" { value = module.images_bucket.public_url }
