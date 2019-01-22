# Builds an image with the PAD application # and a trivial Python HTTP server.
# Build like this:
#    docker build -t ezpad:1.0.0 .
# Launch like this:
#    docker run -p 8000:8000 -d <image-sha-code-here>
FROM python:alpine3.7
COPY . /app
WORKDIR /app
CMD python simple-cors-http-server-python3.py
