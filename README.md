# MENTARI Web

Frontend MENTARI berbasis React + Vite. Project ini disiapkan supaya bisa
di-commit ke Git dan tetap bisa di-upload ke hosting statis yang tidak bisa
menjalankan `npm run dev` atau `npm run build`.

## Struktur Project

```text
frontend/
|- dist/                  # hasil build siap upload ke hosting
|  |- index.html
|  |- .htaccess
|  `- assets/
|- public/                # file statis yang otomatis disalin ke dist
|  `- .htaccess
|- src/                   # source React untuk pengembangan
|- index.html             # entry Vite untuk development
|- package.json
|- package-lock.json
|- vite.config.js
|- .env.example
`- .gitignore
```

## Cara Upload ke Hosting Tanpa NPM

1. Jalankan build di komputer lokal:

   ```bash
   npm install
   npm run build
   ```

2. Commit hasil build:

   ```bash
   git add .
   git commit -m "Build frontend for static hosting"
   git push
   ```

3. Upload isi folder `dist/` ke `public_html` atau document root hosting.
   Yang di-upload adalah isi foldernya, bukan folder `dist` sebagai subfolder,
   kecuali document root hosting memang diarahkan ke `dist`.

4. Jika hosting memakai fitur Git deploy dan tidak bisa menjalankan NPM, arahkan
   document root/domain ke folder `dist`. Jika hosting tidak mendukung document
   root ke `dist`, gunakan FTP/File Manager untuk upload isi `dist/`.

## Catatan Penting

- Folder `dist/` sengaja boleh masuk Git karena hosting target tidak melakukan
  build otomatis.
- Folder `node_modules/`, `.vite/`, dan `.env.local` tidak perlu masuk Git.
- URL API default saat ini: `https://bookperdi.my.id/api/v1`.
- Kalau URL API berubah, ubah `VITE_API_BASE_URL`, lalu jalankan ulang
  `npm run build` dan upload lagi isi `dist/`.
