FROM nginx:alpine

# Remove the default config first
RUN rm /etc/nginx/conf.d/default.conf

# Copy YOUR config as the only conf.d file
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
