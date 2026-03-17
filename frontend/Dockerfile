FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy YOUR nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy your web app files  ← this line might be missing!
COPY index.html /usr/share/nginx/html/index.html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
