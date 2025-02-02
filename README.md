# icon-eu-downloader
Node.js script to fetch DwD's IconEU weather model forecasts

# How to build Docker image

Inside the folder where the Dockerfile is, run the following command:

`docker build -t virtuosofriend/iconeu-downloader:latest .`

# How to test the image locally
Test the Docker image locally:

`docker run --rm \
  -e TIMESTAMP=06 \
  -e PRODUCT=t_2m,ww,clct \
  -e MAX_TIME=48 \
  -v $(pwd)/forecasts:/app/forecasts \
  virtuosofriend/iconeu-downloader:latest
  `
# How to push new image
First tag the release (using latest by default)

`docker tag virtuosofriend/iconeu-downloader:latest virtuosofriend/iconeu-downloader:latest`

`docker push virtuosofriend/iconeu-downloader:latest`
