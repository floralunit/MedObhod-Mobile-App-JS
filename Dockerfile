FROM node:18-alpine

# Установите JDK и Android SDK
RUN apk add --no-cache openjdk11
RUN apk add --no-cache android-sdk

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Соберите APK
RUN cd android && ./gradlew assembleRelease