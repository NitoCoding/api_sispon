# Gunakan base image Node.js
FROM node:18-alpine

# Tentukan working directory dalam container
WORKDIR .

# Salin file package.json dan package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Salin seluruh source code ke dalam container
COPY . .

# Expose port sesuai dengan API
EXPOSE 8001

RUN chmod +x node_modules/.bin/nodemon

RUN npx prisma generate

# Perintah untuk menjalankan aplikasi
CMD ["npm", "run", "dev"]
