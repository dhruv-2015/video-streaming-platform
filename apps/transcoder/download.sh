#! /bin/bash
# Install FFmpeg based on architecture
if [ "$(uname -m)" = "aarch64" ]; then \
    wget https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-arm64-static.tar.xz \
    && tar xf ffmpeg-release-arm64-static.tar.xz \
    && mv ffmpeg-*-arm64-static/ffmpeg /app/ \
    && mv ffmpeg-*-arm64-static/ffprobe /app/ \
    && rm -rf ffmpeg-*-arm64-static*; \
else \
    wget https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz \
    && tar xf ffmpeg-release-amd64-static.tar.xz \
    && mv ffmpeg-*-amd64-static/ffmpeg /app/ \
    && mv ffmpeg-*-amd64-static/ffprobe /app/ \
    && rm -rf ffmpeg-*-amd64-static*; \
fi \
&& chmod +x /app/ffmpeg \
&& chmod +x /app/ffprobe

# Install Shaka Packager based on architecture
if [ "$(uname -m)" = "aarch64" ]; then \
    wget https://github.com/shaka-project/shaka-packager/releases/download/v2.6.1/packager-linux-arm64 \
    && mv packager-linux-arm64 /app/packager; \
else \
    wget https://github.com/shaka-project/shaka-packager/releases/download/v2.6.1/packager-linux-x64 \
    && mv packager-linux-x64 /app/packager; \
fi \
&& chmod +x /app/packager