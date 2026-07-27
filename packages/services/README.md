# @tepian-k3/services

Paket ini menampung berbagai layanan pihak ketiga atau *business logic utilities* yang kompleks (selain manipulasi database langsung).

## Kapan Menulis di Sini?

Jika fungsionalitasnya murni hanya interaksi basis data (CRUD), maka simpan di `@tepian-k3/queries`. 
Sebaliknya, gunakan paket ini untuk:

- Integrasi API eksternal (contoh: Payment Gateway, Email Service, SMS).
- Pengelolaan Penyimpanan File (contoh: Upload/Download dari S3/Supabase Storage melalui `storageService`).
- Layanan enkripsi/hashing (selain auth default).
- Otomasi dokumen PDF atau sertifikat.

Layanan di sini pada akhirnya dapat dipanggil oleh *Router* di `@tepian-k3/api` atau di dalam fungsi *Effect* di `@tepian-k3/queries`.
