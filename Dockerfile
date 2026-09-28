FROM node:20-alpine

# Cài đặt OpenSSL và thư viện cần thiết cho Prisma Engine trên Alpine Linux
RUN apk add --no-cache openssl openssl-dev libc6-compat

WORKDIR /app

# 1. Copy cả package.json VÀ thư mục prisma trước để npm postinstall tìm thấy schema
COPY package*.json ./
COPY prisma ./prisma/

# 2. Cài đặt các thư viện phụ thuộc (lúc này prisma generate sẽ tìm thấy ./prisma/schema.prisma)
RUN npm install --omit=dev

# 3. Copy toàn bộ mã nguồn còn lại của dự án
COPY . .

# 4. Đảm bảo client được generate chuẩn xác
RUN npx prisma generate

EXPOSE 3000

CMD ["node", "server.js"]